"""GitHub integration service."""

import secrets
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.config import settings
from apps.api.models.audit import RepoScanHistory, RepositoryAnalysis
from apps.api.models.user import UserGithubConnection

# In-memory state store for CSRF protection (use Redis in production)
_oauth_states: set[str] = set()


class GitHubService:
    """GitHub OAuth, repo listing, and analysis."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def get_oauth_url(self) -> str:
        state = secrets.token_urlsafe(32)
        _oauth_states.add(state)
        return (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={settings.github_client_id}"
            f"&scope=repo,read:user"
            f"&state={state}"
        )

    async def handle_callback(self, user_id: str, code: str, state: str | None = None) -> dict:
        """Exchange OAuth code for token and save connection."""
        if not state or state not in _oauth_states:
            raise ValueError("Invalid or missing OAuth state parameter")
        _oauth_states.discard(state)
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://github.com/login/oauth/access_token",
                json={"client_id": settings.github_client_id, "client_secret": settings.github_client_secret, "code": code},
                headers={"Accept": "application/json"},
            )
            access_token = resp.json().get("access_token", "")
            user_data = (await client.get("https://api.github.com/user", headers={"Authorization": f"Bearer {access_token}"})).json()
        connection = UserGithubConnection(
            user_id=user_id, github_user_id=user_data.get("id", 0),
            github_username=user_data.get("login", ""), github_avatar_url=user_data.get("avatar_url"),
            access_token=access_token,
        )
        self.session.add(connection)
        await self.session.flush()
        return {"message": "Connected", "username": connection.github_username}

    async def get_connections(self, user_id: str) -> list[UserGithubConnection]:
        result = await self.session.execute(select(UserGithubConnection).where(UserGithubConnection.user_id == user_id))
        return list(result.scalars().all())

    async def disconnect(self, user_id: str) -> None:
        result = await self.session.execute(select(UserGithubConnection).where(UserGithubConnection.user_id == user_id))
        conn = result.scalar_one_or_none()
        if conn:
            await self.session.delete(conn)

    async def disconnect_by_id(self, connection_id) -> None:
        conn = await self.session.get(UserGithubConnection, connection_id)
        if conn:
            await self.session.delete(conn)
            await self.session.flush()

    async def list_repos(self, user_id: str) -> list[dict]:
        conn = await self._get_connection(user_id)
        if not conn:
            return []
        async with httpx.AsyncClient() as client:
            return (await client.get("https://api.github.com/user/repos?sort=updated&per_page=50", headers={"Authorization": f"Bearer {conn.access_token}"})).json()

    async def analyze_repo(self, product_id: UUID, repository_url: str) -> RepositoryAnalysis:
        """Analyze a GitHub repository using the GitHub API."""
        owner_repo = self._parse_owner_repo(repository_url)
        tech_stack: dict = {}
        overall_score: float = 0

        if owner_repo:
            owner, repo = owner_repo
            headers = self._github_headers()
            base = f"https://api.github.com/repos/{owner}/{repo}"
            async with httpx.AsyncClient() as client:
                lang_resp = await client.get(f"{base}/languages", headers=headers, timeout=15)
                if lang_resp.status_code == 200:
                    tech_stack["languages"] = lang_resp.json()

                repo_resp = await client.get(base, headers=headers, timeout=15)
                if repo_resp.status_code == 200:
                    rd = repo_resp.json()
                    tech_stack.update({
                        "default_branch": rd.get("default_branch", "main"),
                        "open_issues": rd.get("open_issues_count", 0),
                        "stars": rd.get("stargazers_count", 0),
                        "forks": rd.get("forks_count", 0),
                        "description": rd.get("description"),
                    })

                contrib_resp = await client.get(
                    f"{base}/contributors?per_page=1&anon=true", headers=headers, timeout=15,
                )
                if contrib_resp.status_code == 200:
                    link_header = contrib_resp.headers.get("link", "")
                    if 'rel="last"' in link_header:
                        import re
                        match = re.search(r"page=(\d+)>; rel=\"last\"", link_header)
                        tech_stack["contributors"] = int(match.group(1)) if match else 1
                    else:
                        tech_stack["contributors"] = len(contrib_resp.json())

            overall_score = sum([
                30 if tech_stack.get("description") else 0,
                30 if (tech_stack.get("contributors", 0) or 0) > 1 else 10,
                20 if (tech_stack.get("open_issues", 0) or 0) < 50 else 5,
                20,
            ])

        analysis = RepositoryAnalysis(
            product_id=product_id, repository_url=repository_url,
            tech_stack=tech_stack or None, overall_score=overall_score, file_count=None,
        )
        self.session.add(analysis)
        await self.session.flush()
        await self.session.refresh(analysis)
        return analysis

    async def get_scan_history(
        self, product_id: UUID
    ) -> list[RepoScanHistory]:
        stmt = (
            select(RepoScanHistory)
            .where(RepoScanHistory.product_id == product_id)
            .order_by(RepoScanHistory.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_latest_analysis(self, product_id: UUID) -> RepositoryAnalysis | None:
        stmt = select(RepositoryAnalysis).where(
            RepositoryAnalysis.product_id == product_id
        ).order_by(RepositoryAnalysis.created_at.desc()).limit(1)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def _resolve_token(
        self, github_token: str | None = None, pat_id: str | None = None
    ) -> str | None:
        """Resolve a GitHub token from explicit value or stored PAT."""
        if github_token:
            return github_token
        if pat_id:
            from apps.api.services.github_pat_service import GitHubPatService
            return await GitHubPatService(self.session).decrypt_token(pat_id)
        return None

    def _github_headers(self, token: str | None = None) -> dict[str, str]:
        """Build GitHub API request headers."""
        headers: dict[str, str] = {"Accept": "application/vnd.github+json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    async def get_repo_info(
        self,
        repository_url: str,
        github_token: str | None = None,
        pat_id: str | None = None,
    ) -> dict:
        token = await self._resolve_token(github_token, pat_id)
        owner_repo = self._parse_owner_repo(repository_url)
        if not owner_repo:
            return {}
        owner, repo = owner_repo
        headers = self._github_headers(token)
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}",
                headers=headers,
                timeout=15,
            )
            if resp.status_code != 200:
                return {}
            data = resp.json()

        if pat_id:
            from apps.api.services.github_pat_service import GitHubPatService
            await GitHubPatService(self.session).update_last_used(pat_id)

        return {
            "name": data.get("name"),
            "full_name": data.get("full_name"),
            "description": data.get("description"),
            "language": data.get("language"),
            "default_branch": data.get("default_branch"),
            "stars": data.get("stargazers_count", 0),
            "forks": data.get("forks_count", 0),
            "open_issues": data.get("open_issues_count", 0),
        }

    async def list_branches(
        self,
        repository_url: str,
        pat_id: str | None = None,
    ) -> list[dict]:
        """List branches for a GitHub repository."""
        token = await self._resolve_token(pat_id=pat_id)
        owner_repo = self._parse_owner_repo(repository_url)
        if not owner_repo:
            return []
        owner, repo = owner_repo
        headers = self._github_headers(token)

        branches: list[dict] = []
        page = 1
        async with httpx.AsyncClient() as client:
            repo_resp = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}",
                headers=headers, timeout=15,
            )
            default_branch = repo_resp.json().get("default_branch", "") if repo_resp.status_code == 200 else ""

            while True:
                resp = await client.get(
                    f"https://api.github.com/repos/{owner}/{repo}/branches",
                    headers=headers, params={"per_page": 100, "page": page}, timeout=15,
                )
                if resp.status_code != 200:
                    break
                data = resp.json()
                if not data:
                    break
                branches.extend({"name": b["name"], "is_default": b["name"] == default_branch} for b in data)
                if len(data) < 100:
                    break
                page += 1

        branches.sort(key=lambda b: (not b["is_default"], b["name"]))
        return branches

    async def check_repo_access(self, product_id: UUID) -> dict:
        """Verify repo is still accessible with stored PAT, update product status."""
        from apps.api.models.product import Product

        product = await self.session.get(Product, product_id)
        if not product or not product.repository_url:
            return {"status": "skipped", "error": None}

        token = await self._resolve_token(pat_id=str(product.github_pat_id) if product.github_pat_id else None)
        owner_repo = self._parse_owner_repo(product.repository_url)
        if not owner_repo:
            return {"status": "skipped", "error": None}

        owner, repo = owner_repo
        headers = self._github_headers(token)
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers, timeout=15)

        if resp.status_code == 200:
            product.github_repo_status = "ok"
            product.github_repo_error = None
        elif resp.status_code in (401, 403):
            product.github_repo_status = "error"
            product.github_repo_error = "Linked PAT no longer has access to this repository"
        else:
            product.github_repo_status = "error"
            product.github_repo_error = "Repository not found or PAT revoked"
        await self.session.flush()
        return {"status": product.github_repo_status, "error": product.github_repo_error}

    async def trigger_scan(self, product_id: UUID) -> dict:
        from apps.api.models.product import Product

        product = await self.session.get(Product, product_id)
        if not product or not product.repository_url:
            return {"status": "no_repository", "files_changed": None}
        scan = RepoScanHistory(
            product_id=product_id, repository_url=product.repository_url,
            branch=product.tracked_branch or "main", latest_commit_sha="pending",
            scan_status="completed", files_changed=0,
        )
        self.session.add(scan)
        await self.session.flush()
        return {"status": "completed", "files_changed": 0}

    @staticmethod
    def _parse_owner_repo(url: str) -> tuple[str, str] | None:
        import re
        m = re.match(r"https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$", url)
        return (m.group(1), m.group(2)) if m else None

    async def _get_connection(self, user_id: str) -> UserGithubConnection | None:
        stmt = select(UserGithubConnection).where(UserGithubConnection.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
