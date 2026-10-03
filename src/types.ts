// API types shared between server and client

export interface RepoInfo {
  name: string
  currentBranch: string
  remotes: Array<{ name: string; url: string }>
  latestCommit: CommitSummary | null
}

export interface CommitSummary {
  hash: string
  shortHash: string
  message: string
  author: string
  email: string
  date: string
  refs: string
}

export interface FileCommitsResponse {
  commits: CommitSummary[]
  file: string
}

export interface FileContentResponse {
  content: string | null
  binary: boolean
  size: number
}

export interface CommitDetail {
  hash: string
  author: string
  email: string
  date: string
  subject: string
  body: string
  changedFiles: Array<{ status: string; file: string }>
}

export interface TreeResponse {
  files: string[]
  commit: string
}

export interface BranchInfo {
  name: string
  current: boolean
  commit: string
}

export interface BranchesResponse {
  current: string
  branches: BranchInfo[]
}

export interface DiffResponse {
  diff: string
}

export interface BlameEntry {
  hash: string
  lineNum: number
  author: string
  date: string
  summary: string
  content: string
}

export interface BlameResponse {
  blame: BlameEntry[]
}

// ─── Tab model ────────────────────────────────────────────────────────────────
export interface FileTab {
  id: string
  filePath: string
  fileName: string
  commitHash: string
  commitShortHash: string
  isDiff: boolean
  diffFromHash?: string
  diffToHash?: string
  type: 'file' | 'diff'
}

// ─── App state ────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark'
