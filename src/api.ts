import type {
  RepoInfo,
  CommitSummary,
  FileContentResponse,
  CommitDetail,
  TreeResponse,
  BranchesResponse,
  DiffResponse,
  FileCommitsResponse,
  BlameResponse,
} from './types'

const BASE = '/api'

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(BASE + path, window.location.origin)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export const api = {
  getRepoInfo: (repoPath: string) =>
    get<RepoInfo>('/repo/info', { path: repoPath }),

  getCommits: (repoPath: string, branch = 'HEAD', limit = 500) =>
    get<{ commits: CommitSummary[] }>('/repo/commits', {
      path: repoPath,
      branch,
      limit: String(limit),
    }),

  getBranches: (repoPath: string) =>
    get<BranchesResponse>('/repo/branches', { path: repoPath }),

  getTree: (repoPath: string, commit: string) =>
    get<TreeResponse>('/repo/tree', { path: repoPath, commit }),

  getFileContent: (repoPath: string, commit: string, file: string) =>
    get<FileContentResponse>('/repo/file', { path: repoPath, commit, file }),

  getFileCommits: (repoPath: string, file: string) =>
    get<FileCommitsResponse>('/repo/file-commits', { path: repoPath, file }),

  getCommitInfo: (repoPath: string, commit: string) =>
    get<CommitDetail>('/repo/commit-info', { path: repoPath, commit }),

  getDiff: (repoPath: string, file: string, from?: string, to?: string) => {
    const params: Record<string, string> = { path: repoPath, file }
    if (from) params.from = from
    if (to) params.to = to
    return get<DiffResponse>('/repo/diff', params)
  },

  getBlame: (repoPath: string, commit: string, file: string) =>
    get<BlameResponse>('/repo/blame', { path: repoPath, commit, file }),

  getRawFileUrl: (repoPath: string, commit: string, file: string) => {
    const url = new URL('/api/repo/raw', window.location.origin)
    url.searchParams.set('path', repoPath)
    url.searchParams.set('commit', commit)
    url.searchParams.set('file', file)
    return url.toString()
  },
}
