export interface GitHubCommit {
  sha: string;
  fullSha: string;
  message: string;
  author: string;
  authorLogin?: string;
  authorAvatar?: string;
  date: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  author: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string | null;
}

export interface GitHubFork {
  id: number;
  fullName: string;
  owner: string;
  ownerAvatar?: string;
  createdAt: string;
}

export interface GitHubRepoInfo {
  name: string;
  fullName: string;
  defaultBranch: string;
  forksCount: number;
  openIssuesCount: number;
  lastPushedAt: string;
  isPrivate: boolean;
}

export interface GitHubInfo {
  repository: GitHubRepoInfo;
  commits: GitHubCommit[];
  pullRequests: GitHubPullRequest[];
  forks: GitHubFork[];
  hasRailwayToml: boolean;
  fetchedAt: string;
}
