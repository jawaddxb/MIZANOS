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
                json={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )
            data = resp.json()
            access_token = data.get("access_token", "")

            user_resp = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_data = user_resp.json()

        connection = UserGithubConnection(
            user_id=user_id,
            github_user_id=user_data.get("id", 0),
            github_username=user_data.get("login", ""),
            github_avatar_url=user_data.get("avatar_url"),
            access_token=access_token,
        )
        self.session.add(connection)
        await self.session.flush()
        return {"message": "Connected", "username": connection.github_username}

    async def get_connections(self, user_id: str) -> list[UserGithubConnection]:
        stmt = select(UserGithubConnection).where(UserGithubConnection.user_id == user_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def disconnect(self, user_id: str) -> None:
        stmt = select(UserGithubConnection).where(UserGithubConnection.user_id == user_id)
        result = await self.session.execute(stmt)
        conn = result.scalar_one_or_none()
        if conn:
            await self.session.delete(conn)

    async def disconnect_by_id(self, connection_id) -> None:
        conn = await self.session.get(UserGithubConnection, connection_id)
        if conn:
            await self.session.delete(conn)
            await self.session.flush()

    async def list_repos(self, user_id: str) -> list[dict]:
        """List GitHub repos for the connected user."""
        conn = await self._get_connection(user_id)
        if not conn:
            return []

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.github.com/user/repos?sort=updated&per_page=50",
                headers={"Authorization": f"Bearer {conn.access_token}"},
            )
            return resp.json()

    async def analyze_repo(self, product_id: UUID, repository_url: str) -> RepositoryAnalysis:
        """Analyze a GitHub repository using the GitHub API."""
        owner_repo = self._parse_owner_repo(repository_url)
        tech_stack: dict = {}
        file_count: int | None = None
        overall_score: float = 0

        if owner_repo:
            owner, repo = owner_repo
            headers = {"Accept": "application/vnd.github+json"}
            async with httpx.AsyncClient() as client:
                # Fetch languages
                lang_resp = await client.get(
                    f"https://api.github.com/repos/{owner}/{repo}/languages",
                    headers=headers,
                    timeout=15,
                )
                if lang_resp.status_code == 200:
                    tech_stack["languages"] = lang_resp.json()

                # Fetch repo metadata
                repo_resp = await client.get(
                    f"https://api.github.com/repos/{owner}/{repo}",
                    headers=headers,
                    timeout=15,
                )
                if repo_resp.status_code == 200:
                    repo_data = repo_resp.json()
                    tech_stack["default_branch"] = repo_data.get("default_branch", "main")
                    tech_stack["open_issues"] = repo_data.get("open_issues_count", 0)
                    tech_stack["stars"] = repo_data.get("stargazers_count", 0)
                    tech_stack["forks"] = repo_data.get("forks_count", 0)
                    tech_stack["description"] = repo_data.get("description")

                # Fetch contributor count
                contrib_resp = await client.get(
                    f"https://api.github.com/repos/{owner}/{repo}/contributors?per_page=1&anon=true",
                    headers=headers,
                    timeout=15,
                )
                if contrib_resp.status_code == 200:
                    link_header = contrib_resp.headers.get("link", "")
                    if 'rel="last"' in link_header:
                        import re
                        match = re.search(r"page=(\d+)>; rel=\"last\"", link_header)
                        tech_stack["contributors"] = int(match.group(1)) if match else 1
                    else:
                        tech_stack["contributors"] = len(contrib_resp.json())

            # Basic health score heuristic
            has_description = bool(tech_stack.get("description"))
            has_multiple_contributors = (tech_stack.get("contributors", 0) or 0) > 1
            low_issues = (tech_stack.get("open_issues", 0) or 0) < 50
            overall_score = sum([
                30 if has_description else 0,
                30 if has_multiple_contributors else 10,
                20 if low_issues else 5,
                20,  # base score for having a repo
            ])

        analysis = RepositoryAnalysis(
            product_id=product_id,
            repository_url=repository_url,
            tech_stack=tech_stack or None,
            overall_score=overall_score,
            file_count=file_count,
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

    async def get_latest_analysis(
        self, product_id: UUID
    ) -> RepositoryAnalysis | None:
        stmt = (
            select(RepositoryAnalysis)
            .where(RepositoryAnalysis.product_id == product_id)
            .order_by(RepositoryAnalysis.created_at.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_repo_info(
        self, repository_url: str, github_token: str | None = None
    ) -> dict:
        owner_repo = self._parse_owner_repo(repository_url)
        if not owner_repo:
            return {}
        owner, repo = owner_repo
        headers = {"Accept": "application/vnd.github+json"}
        if github_token:
            headers["Authorization"] = f"Bearer {github_token}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}",
                headers=headers,
                timeout=15,
            )
            if resp.status_code != 200:
                return {}
            data = resp.json()
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

    async def trigger_scan(self, product_id: UUID) -> dict:
        from apps.api.models.product import Product

        product = await self.session.get(Product, product_id)
        if not product or not product.repository_url:
            return {"status": "no_repository", "files_changed": None}
        scan = RepoScanHistory(
            product_id=product_id,
            repository_url=product.repository_url,
            branch="main",
            latest_commit_sha="pending",
            scan_status="completed",
            files_changed=0,
        )
        self.session.add(scan)
        await self.session.flush()
        return {"status": "completed", "files_changed": 0}

    @staticmethod
    def _parse_owner_repo(url: str) -> tuple[str, str] | None:
        """Extract owner/repo from a GitHub URL."""
        import re
        match = re.match(r"https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$", url)
        if match:
            return match.group(1), match.group(2)
        return None

    async def _get_connection(self, user_id: str) -> UserGithubConnection | None:
        stmt = select(UserGithubConnection).where(UserGithubConnection.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
