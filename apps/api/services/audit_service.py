"""Audit service."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.audit import Audit
from apps.api.services.base_service import BaseService


class AuditService(BaseService[Audit]):
    """Audit business logic."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Audit, session)

    async def get_by_product(
        self,
        product_id: UUID,
        *,
        page: int = 1,
        page_size: int = 50,
    ) -> dict:
        stmt = select(Audit).where(Audit.product_id == product_id)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.repo.session.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(Audit.run_at.desc()).offset(
            (page - 1) * page_size
        ).limit(page_size)
        result = await self.repo.session.execute(stmt)
        return {
            "data": list(result.scalars().all()),
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    async def run_audit(self, product_id: UUID, user_id: str) -> Audit:
        """Run audit combining QA checks and optional repo evaluation."""
        from apps.api.models.product import Product
        from apps.api.models.qa import QACheck

        # 1. QA-based scoring
        qa_stmt = select(QACheck).where(QACheck.product_id == product_id)
        qa_result = await self.repo.session.execute(qa_stmt)
        qa_checks = list(qa_result.scalars().all())

        categories: dict[str, float] = {}
        issues: dict[str, list] = {"critical": [], "warnings": []}

        if qa_checks:
            cat_groups: dict[str, list[QACheck]] = {}
            for check in qa_checks:
                cat = check.category or "general"
                if cat not in cat_groups:
                    cat_groups[cat] = []
                cat_groups[cat].append(check)

            for cat, checks in cat_groups.items():
                passed = sum(1 for c in checks if c.status == "passed")
                total = len(checks)
                score = round((passed / total) * 100, 1) if total > 0 else 0
                categories[cat] = score

                for c in checks:
                    if c.status == "failed":
                        issues["critical"].append({
                            "check_id": str(c.id),
                            "title": c.title,
                            "category": cat,
                        })
                    elif c.status == "warning":
                        issues["warnings"].append({
                            "check_id": str(c.id),
                            "title": c.title,
                            "category": cat,
                        })

        # 2. Repo evaluation (if repo linked)
        product = await self.repo.session.get(Product, product_id)
        if product and product.repository_url:
            repo_scores = await self._run_repo_evaluation(
                product.repository_url
            )
            if repo_scores:
                categories.update(repo_scores.get("categories", {}))
                issues.setdefault("code_violations", []).extend(
                    repo_scores.get("violations", [])
                )

        # 3. Compute overall score
        overall_score = (
            round(sum(categories.values()) / len(categories), 1)
            if categories
            else 0
        )

        audit = Audit(
            product_id=product_id,
            created_by=user_id,
            overall_score=overall_score,
            categories=categories,
            issues=issues,
        )
        return await self.repo.create(audit)

    async def _run_repo_evaluation(
        self, repository_url: str
    ) -> dict | None:
        """Clone repo to temp dir and run evaluator."""
        import logging
        import shutil
        import subprocess
        import tempfile

        logger = logging.getLogger(__name__)
        tmp_dir = None
        try:
            tmp_dir = tempfile.mkdtemp(prefix="mizan-audit-")
            subprocess.run(
                ["git", "clone", "--depth", "1", repository_url, tmp_dir],
                capture_output=True,
                timeout=60,
                check=True,
            )

            from apps.api.services.repo_evaluator import RepoEvaluator

            result = RepoEvaluator().evaluate(tmp_dir)
            return {
                "categories": {
                    "code_quality": result.summary_score,
                },
                "violations": [],
            }
        except Exception:
            logger.debug("Repo evaluation skipped", exc_info=True)
            return None
        finally:
            if tmp_dir:
                shutil.rmtree(tmp_dir, ignore_errors=True)

    async def compare(self, product_id: UUID) -> dict:
        """Compare the latest two audits for a product."""
        stmt = (
            select(Audit)
            .where(Audit.product_id == product_id)
            .order_by(Audit.run_at.desc())
            .limit(2)
        )
        result = await self.repo.session.execute(stmt)
        audits = list(result.scalars().all())

        if len(audits) == 0:
            return {
                "product_id": product_id,
                "current": None,
                "previous": None,
                "score_diff": 0,
                "categories_diff": {},
                "has_comparison": False,
            }

        current = audits[0]
        previous = audits[1] if len(audits) > 1 else None
        score_diff = 0.0
        categories_diff: dict = {}

        if previous:
            score_diff = current.overall_score - previous.overall_score
            all_keys = set(current.categories.keys()) | set(
                previous.categories.keys()
            )
            for key in all_keys:
                cur_val = current.categories.get(key)
                prev_val = previous.categories.get(key)
                if isinstance(cur_val, (int, float)) and isinstance(
                    prev_val, (int, float)
                ):
                    categories_diff[key] = cur_val - prev_val

        return {
            "product_id": product_id,
            "current": current,
            "previous": previous,
            "score_diff": score_diff,
            "categories_diff": categories_diff,
            "has_comparison": previous is not None,
        }
