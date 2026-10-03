import React, { useState, useCallback, useEffect, useRef } from 'react'
import { ThemeProvider, useTheme, SYNTAX_THEMES } from './ThemeContext'
import { CommitList } from './CommitList'
import { FileTree } from './FileTree'
import { CodeViewer } from './CodeViewer'
import { DiffViewer } from './DiffViewer'
import { Timeline } from './Timeline'
import { FileIcon } from './FileIcon'
import { api } from './api'
import type { CommitSummary, FileTab, RepoInfo } from './types'
import { formatDate, getLanguageLabel, getFileType } from './utils'
import {
  Sun, Moon, GitBranch, GitCommit, FolderOpen, Search,
  X, ChevronDown, ChevronRight, ChevronLeft, Layers,
  Check, Diff, RefreshCw, Copy, FileText,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// ─── Icon button ──────────────────────────────────────────────────────────────
function IconBtn({
  onClick, title, children, active = false, small = false,
}: {
  onClick?: () => void
  title?: string
  children: React.ReactNode
  active?: boolean
  small?: boolean
}) {
  return (
    <button
      className={cn('icon-btn', small && 'icon-btn-sm', active && 'active')}
      onClick={onClick}
      title={title}
      style={active ? { color: 'var(--accent)', background: 'var(--accent-muted)' } : undefined}
    >
      {children}
    </button>
  )
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown({ trigger, children, align = 'right' }: {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div className="dropdown-wrapper" ref={ref}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div className="dropdown fade-in" style={align === 'left' ? { right: 'auto', left: 0 } : {}}>
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  )
}

// ─── Activity button ──────────────────────────────────────────────────────────
function ActivityBtn({
  active, onClick, title, children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      className={cn('activity-btn', active && 'active')}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}

// ─── Repo path input dialog ────────────────────────────────────────────────────
function RepoOpenDialog({ onOpen, onClose }: { onOpen: (path: string) => void; onClose?: () => void }) {
  const [path, setPath] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (path.trim()) {
      setError('')
      onOpen(path.trim())
    }
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose()
      }}
    >
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 22,
        width: 460,
        maxWidth: '90vw',
        boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
      }} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOpen size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Open Git Repository</h2>
          </div>
          {onClose && (
            <button className="icon-btn icon-btn-sm" onClick={onClose} title="Close (Esc)">
              <X size={13} />
            </button>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
          Enter the full local path to a repository folder containing a <code style={{ fontSize: 10.5, background: 'var(--bg-muted)', padding: '1.5px 4px', borderRadius: 3 }}>.git</code> directory.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            className="repo-input"
            style={{ width: '100%', marginBottom: 8 }}
            value={path}
            onChange={e => { setPath(e.target.value); setError('') }}
            placeholder="e.g. E:\Projects\browser-explorer"
            autoFocus
          />
          {error && <p style={{ fontSize: 11, color: 'var(--removed)', margin: '0 0 8px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            {onClose && (
              <button
                type="button"
                className="icon-btn"
                style={{ width: 'auto', padding: '0 12px', fontSize: 12 }}
                onClick={onClose}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="open-btn"
              style={{ padding: '6px 14px', marginTop: 0 }}
              disabled={!path.trim()}
            >
              Open
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Commit info panel ────────────────────────────────────────────────────────
function CommitInfoPanel({
  commit, repoPath, onOpenFile, currentCommitHash,
}: {
  commit: CommitSummary
  repoPath: string
  onOpenFile: (path: string, hash: string) => void
  currentCommitHash: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [changedFiles, setChangedFiles] = useState<Array<{ status: string; file: string }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.getCommitInfo(repoPath, commit.hash)
      .then(info => setChangedFiles(info.changedFiles))
      .catch(() => setChangedFiles([]))
      .finally(() => setLoading(false))
  }, [commit.hash, repoPath])

  const statusColor: Record<string, string> = {
    A: 'var(--added)', M: 'var(--accent)', D: 'var(--removed)',
    R: 'var(--accent)', C: 'var(--accent)',
  }
  const statusLabel: Record<string, string> = {
    A: 'A', M: 'M', D: 'D', R: 'R', C: 'C',
  }

  return (
    <div style={{
      padding: '10px',
      borderBottom: '1px solid var(--border-subtle)',
      fontSize: 12,
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: '"SF Mono", "Fira Code", monospace',
            fontSize: 10, color: 'var(--accent)', marginBottom: 4,
          }}>
            {commit.shortHash}
          </div>
          <div style={{ color: 'var(--fg)', fontWeight: 500, lineHeight: 1.4, fontSize: 12 }}>
            {commit.message}
          </div>
          <div style={{ color: 'var(--fg-dim)', fontSize: 11, marginTop: 4 }}>
            {commit.author} · {formatDate(commit.date)}
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="icon-btn icon-btn-sm"
          title={expanded ? 'Collapse' : 'Show changed files'}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 6 }}>
          {loading ? (
            <p style={{ color: 'var(--fg-dim)', fontSize: 11, margin: 0 }}>Loading…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {changedFiles.map(({ status, file }) => {
                const fname = file.split('/').pop() || file
                return (
                  <div
                    key={file}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '2px 4px', borderRadius: 3, cursor: 'pointer',
                      fontSize: 11, color: 'var(--fg-muted)',
                    }}
                    onClick={() => onOpenFile(file, commit.hash)}
                    title={file}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{
                      fontSize: 9, fontWeight: 700, width: 12, flexShrink: 0,
                      color: statusColor[status] || 'var(--fg-dim)',
                    }}>
                      {statusLabel[status] || status}
                    </span>
                    <FileIcon name={fname} size={11} />
                    <span style={{
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    }}>
                      {fname}
                    </span>
                  </div>
                )
              })}
              {changedFiles.length === 0 && (
                <p style={{ color: 'var(--fg-dim)', fontSize: 11, margin: 0 }}>No file changes found</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab label ────────────────────────────────────────────────────────────────
function TabLabel({ tab }: { tab: FileTab }) {
  const fileName = tab.fileName
  return (
    <>
      <span className="tree-icon">
        <FileIcon name={fileName} size={12} />
      </span>
      <span className="tab-name">{fileName}</span>
      {tab.isDiff && <span className="tab-diff-badge">DIFF</span>}
      <span style={{
        fontSize: 9, fontFamily: 'monospace', color: 'var(--fg-dim)',
        background: 'var(--bg-muted)', padding: '0 3px', borderRadius: 2, flexShrink: 0,
      }}>
        {tab.commitShortHash}
      </span>
    </>
  )
}

// ─── Main App Inner ───────────────────────────────────────────────────────────
type SidebarPanel = 'commits' | 'files'

function AppInner() {
  const { theme, toggleTheme, syntaxTheme, setSyntaxTheme } = useTheme()

  // ── Repo state ──
  const [repoPath, setRepoPath] = useState<string>('')
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null)
  const [commits, setCommits] = useState<CommitSummary[]>([])
  const [branches, setBranches] = useState<Array<{ name: string; current: boolean; commit: string }>>([])
  const [currentBranch, setCurrentBranch] = useState<string>('')
  const [repoLoading, setRepoLoading] = useState(false)
  const [repoError, setRepoError] = useState<string>('')

  // ── Selected commit ──
  const [selectedCommit, setSelectedCommit] = useState<CommitSummary | null>(null)

  // ── File tree state ──
  const [treeFiles, setTreeFiles] = useState<string[]>([])
  const [treeLoading, setTreeLoading] = useState(false)
  const [selectedFilePath, setSelectedFilePath] = useState<string>('')
  const [fileSearch, setFileSearch] = useState('')

  // ── Tabs ──
  const [tabs, setTabs] = useState<FileTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  // ── File content cache ──
  const [fileContents, setFileContents] = useState<Map<string, { content: string | null; binary: boolean; loading: boolean }>>(new Map())
  const [fileDiffs, setFileDiffs] = useState<Map<string, { diff: string; loading: boolean }>>(new Map())

  // ── File timeline ──
  const [fileCommits, setFileCommits] = useState<CommitSummary[]>([])
  const [fileCommitsLoading, setFileCommitsLoading] = useState(false)

  // ── UI state ──
  const [showOpenDialog, setShowOpenDialog] = useState(true)
  const [leftPanel, setLeftPanel] = useState<SidebarPanel>('commits')
  const [commitSearch, setCommitSearch] = useState('')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)

  const activeTab = tabs.find(t => t.id === activeTabId) || null

  // ─── Load repo ──────────────────────────────────────────────────────────────
  const loadRepo = useCallback(async (path: string) => {
    setRepoLoading(true)
    setRepoError('')
    setCommits([])
    setTabs([])
    setActiveTabId(null)
    setSelectedCommit(null)
    setTreeFiles([])
    setFileCommits([])
    setFileContents(new Map())
    setFileDiffs(new Map())

    try {
      const [info, commitsData, branchData] = await Promise.all([
        api.getRepoInfo(path),
        api.getCommits(path),
        api.getBranches(path),
      ])
      setRepoInfo(info)
      setCommits(commitsData.commits)
      setBranches(branchData.branches)
      setCurrentBranch(branchData.current)

      // Auto-select latest commit
      if (commitsData.commits.length > 0) {
        const latest = commitsData.commits[0]
        setSelectedCommit(latest)
        loadTree(path, latest.hash)
      }

      setRepoPath(path)
      setShowOpenDialog(false)
    } catch (err: any) {
      setRepoError(err.message || 'Failed to load repository')
      setShowOpenDialog(true)
    } finally {
      setRepoLoading(false)
    }
  }, [])

  // ─── Load tree for commit ───────────────────────────────────────────────────
  const loadTree = useCallback(async (path: string, commitHash: string) => {
    setTreeLoading(true)
    try {
      const data = await api.getTree(path, commitHash)
      setTreeFiles(data.files)
    } catch {
      setTreeFiles([])
    } finally {
      setTreeLoading(false)
    }
  }, [])

  // ─── Select commit ──────────────────────────────────────────────────────────
  const handleSelectCommit = useCallback((commit: CommitSummary) => {
    setSelectedCommit(commit)
    loadTree(repoPath, commit.hash)
    // If there's an active file tab, update it to show the file at this commit
  }, [repoPath, loadTree])

  // ─── Open file in tab ───────────────────────────────────────────────────────
  const openFile = useCallback((filePath: string, commitHash: string, isDiff = false, diffFromHash?: string, diffToHash?: string) => {
    const fileName = filePath.split('/').pop() || filePath
    const shortHash = commitHash.slice(0, 7)
    const tabId = isDiff
      ? `diff:${filePath}:${diffFromHash || ''}:${diffToHash || commitHash}`
      : `file:${filePath}:${commitHash}`

    setTabs(prev => {
      const existing = prev.find(t => t.id === tabId)
      if (existing) {
        setActiveTabId(existing.id)
        return prev
      }
      const newTab: FileTab = {
        id: tabId,
        filePath,
        fileName,
        commitHash,
        commitShortHash: shortHash,
        isDiff,
        diffFromHash,
        diffToHash,
        type: isDiff ? 'diff' : 'file',
      }
      setActiveTabId(tabId)
      return [...prev, newTab]
    })

    setSelectedFilePath(filePath)

    // Load file commits for timeline
    if (!isDiff) {
      setFileCommitsLoading(true)
      api.getFileCommits(repoPath, filePath)
        .then(data => setFileCommits(data.commits))
        .catch(() => setFileCommits([]))
        .finally(() => setFileCommitsLoading(false))
    }

    // Load content if not cached
    if (!isDiff) {
      setFileContents(prev => {
        if (prev.has(tabId)) return prev
        const next = new Map(prev)
        next.set(tabId, { content: null, binary: false, loading: true })
        return next
      })

      api.getFileContent(repoPath, commitHash, filePath)
        .then(data => {
          setFileContents(prev => {
            const next = new Map(prev)
            next.set(tabId, { content: data.content, binary: data.binary, loading: false })
            return next
          })
        })
        .catch(() => {
          setFileContents(prev => {
            const next = new Map(prev)
            next.set(tabId, { content: null, binary: false, loading: false })
            return next
          })
        })
    } else {
      // Load diff
      setFileDiffs(prev => {
        if (prev.has(tabId)) return prev
        const next = new Map(prev)
        next.set(tabId, { diff: '', loading: true })
        return next
      })

      api.getDiff(repoPath, filePath, diffFromHash, diffToHash || commitHash)
        .then(data => {
          setFileDiffs(prev => {
            const next = new Map(prev)
            next.set(tabId, { diff: data.diff, loading: false })
            return next
          })
        })
        .catch(() => {
          setFileDiffs(prev => {
            const next = new Map(prev)
            next.set(tabId, { diff: '', loading: false })
            return next
          })
        })
    }
  }, [repoPath])

  // ─── Open diff for active file ─────────────────────────────────────────────
  const openDiffForCurrentFile = useCallback(() => {
    if (!activeTab || activeTab.isDiff) return
    if (!selectedCommit) return

    // Find previous commit for this file
    const fileCommitIdx = fileCommits.findIndex(c => c.hash === activeTab.commitHash)
    const prevCommit = fileCommits[fileCommitIdx + 1]

    if (prevCommit) {
      openFile(activeTab.filePath, activeTab.commitHash, true, prevCommit.hash, activeTab.commitHash)
    }
  }, [activeTab, fileCommits, selectedCommit, openFile])

  // ─── Close tab ─────────────────────────────────────────────────────────────
  const closeTab = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === id)
      const next = prev.filter(t => t.id !== id)
      if (activeTabId === id) {
        if (next.length > 0) setActiveTabId(next[Math.min(idx, next.length - 1)].id)
        else setActiveTabId(null)
      }
      return next
    })
  }, [activeTabId])

  // ─── Branch switch ─────────────────────────────────────────────────────────
  const switchBranch = useCallback(async (branchName: string) => {
    setCurrentBranch(branchName)
    setCommits([])
    setSelectedCommit(null)
    setTreeFiles([])
    setTabs([])
    setActiveTabId(null)

    try {
      const data = await api.getCommits(repoPath, branchName)
      setCommits(data.commits)
      if (data.commits.length > 0) {
        const latest = data.commits[0]
        setSelectedCommit(latest)
        loadTree(repoPath, latest.hash)
      }
    } catch (err: any) {
      setRepoError(err.message)
    }
  }, [repoPath, loadTree])

  // ─── Refresh ────────────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    if (repoPath) loadRepo(repoPath)
  }, [repoPath, loadRepo])

  // ─── Copy path ─────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false)
  const copyPath = useCallback(() => {
    if (activeTab) {
      navigator.clipboard.writeText(activeTab.filePath)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    }
  }, [activeTab])

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      // Ctrl+W: Close active tab
      if ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W') && activeTabId) {
        e.preventDefault()
        closeTab(activeTabId)
      }
      // Ctrl+B: Toggle commit sidebar
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault()
        setLeftSidebarOpen(o => !o)
      }
      // Ctrl+O: Open repository dialog
      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault()
        setShowOpenDialog(true)
      }
      // Ctrl+Tab: Cycle through open tabs
      if (e.ctrlKey && e.key === 'Tab' && tabs.length > 1) {
        e.preventDefault()
        const idx = tabs.findIndex(t => t.id === activeTabId)
        const nextIdx = e.shiftKey
          ? (idx - 1 + tabs.length) % tabs.length
          : (idx + 1) % tabs.length
        setActiveTabId(tabs[nextIdx].id)
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [activeTabId, closeTab, tabs])

  // ─── Render active tab content ─────────────────────────────────────────────
  const renderTabContent = () => {
    if (!activeTab) {
      return (
        <div className="welcome">
          <div style={{ opacity: 0.2 }}>
            <GitCommit size={56} />
          </div>
          <h2>{repoPath ? 'Select a file to view' : 'No repository open'}</h2>
          <p>
            {repoPath
              ? 'Browse commits on the left, then select a file from the right panel to view its content.'
              : 'Open a git repository to start exploring file history across commits.'}
          </p>
          {!repoPath && (
            <button className="open-btn" onClick={() => setShowOpenDialog(true)}>
              <FolderOpen size={15} />
              Open Repository
            </button>
          )}
        </div>
      )
    }

    if (activeTab.isDiff) {
      const diffData = fileDiffs.get(activeTab.id)
      return (
        <DiffViewer
          diff={diffData?.diff || ''}
          loading={diffData?.loading ?? true}
        />
      )
    }

    const fileData = fileContents.get(activeTab.id)
    return (
      <CodeViewer
        content={fileData?.content ?? null}
        fileName={activeTab.fileName}
        filePath={activeTab.filePath}
        repoPath={repoPath}
        commitHash={activeTab.commitHash}
        syntaxTheme={syntaxTheme}
        binary={fileData?.binary}
        loading={fileData?.loading ?? true}
      />
    )
  }

  const fileType = activeTab ? getFileType(activeTab.fileName) : null
  const langLabel = fileType ? getLanguageLabel(fileType) : ''

  return (
    <div className="app-layout">
      {/* ─── TOPBAR ─── */}
      <header className="topbar">
        <div className="topbar-left">
          {/* App logo/title */}
          <span className="app-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="var(--accent)" />
              <circle cx="8" cy="8" r="6.5" stroke="var(--accent)" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="8" y1="1" x2="8" y2="15" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="2 2" />
            </svg>
            FileTrack
            {repoInfo && (
              <>
                <span style={{ color: 'var(--fg-dim)' }}>·</span>
                <span style={{ color: 'var(--fg-muted)', fontWeight: 400 }}>{repoInfo.name}</span>
              </>
            )}
          </span>

          {/* Branch selector */}
          {branches.length > 0 && (
            <Dropdown
              align="left"
              trigger={
                <button className="branch-selector">
                  <GitBranch size={11} />
                  <span>{currentBranch}</span>
                  <ChevronDown size={10} />
                </button>
              }
            >
              <div className="dropdown-label">Switch Branch</div>
              {branches.map(b => (
                <button
                  key={b.name}
                  className={cn('dropdown-item', b.name === currentBranch && 'active')}
                  onClick={() => switchBranch(b.name)}
                >
                  <GitBranch size={11} />
                  {b.name}
                  {b.current && <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--accent)' }}>current</span>}
                </button>
              ))}
            </Dropdown>
          )}
        </div>

        <div className="topbar-right">
          {/* Open repo */}
          <IconBtn onClick={() => setShowOpenDialog(true)} title="Open Repository">
            <FolderOpen size={15} />
          </IconBtn>

          {/* Refresh */}
          {repoPath && (
            <IconBtn onClick={refresh} title="Refresh">
              <RefreshCw size={14} />
            </IconBtn>
          )}

          {/* Diff button for current file */}
          {activeTab && !activeTab.isDiff && fileCommits.length > 1 && (
            <IconBtn onClick={openDiffForCurrentFile} title="View diff with previous commit">
              <Diff size={14} />
            </IconBtn>
          )}

          {/* Syntax theme */}
          <Dropdown
            trigger={
              <IconBtn title="Syntax theme">
                <Layers size={14} />
              </IconBtn>
            }
          >
            <div className="dropdown-label">Syntax Theme</div>
            {SYNTAX_THEMES.map(t => (
              <button
                key={t.id}
                className={cn('dropdown-item', syntaxTheme === t.id && 'active')}
                onClick={() => setSyntaxTheme(t.id)}
              >
                {syntaxTheme === t.id && <Check size={10} />}
                {t.label}
              </button>
            ))}
          </Dropdown>

          {/* Theme toggle */}
          <IconBtn onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={14} />}
          </IconBtn>
        </div>
      </header>

      {/* ─── BODY ─── */}
      <div className="body-layout">
        {/* ─── ACTIVITY BAR ─── */}
        <nav className="activity-bar">
          <div className="activity-bar-top">
            <ActivityBtn
              active={leftPanel === 'commits' && leftSidebarOpen}
              onClick={() => {
                if (leftPanel === 'commits' && leftSidebarOpen) setLeftSidebarOpen(false)
                else { setLeftPanel('commits'); setLeftSidebarOpen(true) }
              }}
              title="Commit History"
            >
              <GitCommit size={18} />
            </ActivityBtn>
            <ActivityBtn
              active={leftSidebarOpen && false}
              onClick={() => setLeftSidebarOpen(o => !o)}
              title="Toggle Sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="2" width="14" height="14" rx="2" />
                <line x1="7" y1="2" x2="7" y2="16" />
              </svg>
            </ActivityBtn>
          </div>
          <div className="activity-bar-bottom">
            <ActivityBtn
              active={false}
              onClick={() => setShowOpenDialog(true)}
              title="Open Repository"
            >
              <FolderOpen size={18} />
            </ActivityBtn>
          </div>
        </nav>

        {/* ─── LEFT SIDEBAR (Commits) ─── */}
        {leftSidebarOpen && (
          <aside className="sidebar">
            <div className="sidebar-header">
              <span className="sidebar-title">History</span>
              <div style={{ display: 'flex', gap: 2 }}>
                <IconBtn small title="Search commits" onClick={() => {}}>
                  <Search size={12} />
                </IconBtn>
              </div>
            </div>

            {/* Search */}
            {commits.length > 0 && (
              <div className="search-bar">
                <Search size={11} style={{ color: 'var(--fg-dim)', flexShrink: 0 }} />
                <input
                  className="search-input"
                  placeholder="Search commits…"
                  value={commitSearch}
                  onChange={e => setCommitSearch(e.target.value)}
                />
                {commitSearch && (
                  <button className="icon-btn" style={{ width: 16, height: 16 }} onClick={() => setCommitSearch('')}>
                    <X size={10} />
                  </button>
                )}
              </div>
            )}

            <div className="sidebar-scroll">
              {repoLoading ? (
                <div className="sidebar-empty">
                  <div className="spinner" />
                  <p style={{ fontSize: 11, color: 'var(--fg-dim)', marginTop: 8 }}>Loading commits…</p>
                </div>
              ) : repoError ? (
                <div className="sidebar-empty">
                  <p style={{ fontSize: 11, color: 'var(--removed)' }}>{repoError}</p>
                  <button
                    className="open-btn"
                    style={{ marginTop: 8, padding: '5px 12px', fontSize: 11 }}
                    onClick={() => setShowOpenDialog(true)}
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  {/* Active commit info */}
                  {selectedCommit && (
                    <CommitInfoPanel
                      commit={selectedCommit}
                      repoPath={repoPath}
                      onOpenFile={(path, hash) => openFile(path, hash)}
                      currentCommitHash={selectedCommit.hash}
                    />
                  )}
                  <CommitList
                    commits={commits}
                    selectedHash={selectedCommit?.hash}
                    onSelect={handleSelectCommit}
                    searchQuery={commitSearch}
                  />
                </>
              )}
            </div>
          </aside>
        )}

        {/* ─── MAIN CONTENT ─── */}
        <main className="main-content">
          {/* Tab bar */}
          {tabs.length > 0 && (
            <div className="tab-bar">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className={cn('tab', tab.id === activeTabId && 'active')}
                  onClick={() => {
                    setActiveTabId(tab.id)
                    setSelectedFilePath(tab.filePath)
                    // Reload file commits for timeline
                    if (!tab.isDiff) {
                      setFileCommitsLoading(true)
                      api.getFileCommits(repoPath, tab.filePath)
                        .then(data => setFileCommits(data.commits))
                        .catch(() => setFileCommits([]))
                        .finally(() => setFileCommitsLoading(false))
                    }
                  }}
                  title={`${tab.filePath} @ ${tab.commitShortHash}`}
                >
                  <TabLabel tab={tab} />
                  <span
                    className="tab-close"
                    onClick={e => closeTab(tab.id, e)}
                  >
                    <X size={10} />
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Breadcrumb */}
          {activeTab && (
            <div className="breadcrumb">
              {activeTab.filePath.split('/').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="breadcrumb-sep">/</span>}
                  <span className={cn('breadcrumb-part', i === arr.length - 1 && 'last')}>
                    {part}
                  </span>
                </React.Fragment>
              ))}
              {activeTab && (
                <>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--accent)', marginRight: 4 }}>
                    {activeTab.isDiff
                      ? `${activeTab.diffFromHash?.slice(0, 7)} → ${activeTab.diffToHash?.slice(0, 7) || activeTab.commitShortHash}`
                      : `@ ${activeTab.commitShortHash}`}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Editor area */}
          <div className="editor-area">
            {renderTabContent()}
          </div>

          {/* Timeline */}
          <Timeline
            commits={fileCommits}
            activeCommitHash={activeTab?.commitHash}
            activeFilePath={activeTab?.filePath}
            onSelect={commit => {
              if (activeTab && !activeTab.isDiff) {
                openFile(activeTab.filePath, commit.hash)
              }
            }}
            onDiff={(fromCommit, toCommit) => {
              if (activeTab && !activeTab.isDiff) {
                openFile(activeTab.filePath, toCommit.hash, true, fromCommit.hash, toCommit.hash)
              }
            }}
          />

          {/* Status bar */}
          <div className="status-bar">
            <div className="status-left">
              {repoInfo ? (
                <>
                  <span><GitBranch size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />{currentBranch}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span>{commits.length} commit{commits.length !== 1 ? 's' : ''}</span>
                </>
              ) : (
                <span>FileTrack</span>
              )}
              {activeTab && (
                <>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span>{activeTab.filePath}</span>
                </>
              )}
            </div>
            <div className="status-right">
              {langLabel && <span>{langLabel}</span>}
              {activeTab && <span style={{ opacity: 0.5 }}>·</span>}
              {selectedCommit && (
                <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{selectedCommit.shortHash}</span>
              )}
            </div>
          </div>
        </main>

        {/* ─── RIGHT SIDEBAR (File Explorer) ─── */}
        {rightSidebarOpen && selectedCommit && (
          <aside className="right-sidebar">
            <div className="sidebar-header">
              <span className="sidebar-title">Files</span>
              <div style={{ display: 'flex', gap: 2 }}>
                <IconBtn small title="Close file explorer" onClick={() => setRightSidebarOpen(false)}>
                  <X size={11} />
                </IconBtn>
              </div>
            </div>

            {/* Commit mini info */}
            <div style={{
              padding: '6px 10px',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: 11,
              color: 'var(--fg-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>
                {selectedCommit.shortHash}
              </span>
              <span style={{
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
              }}>
                {selectedCommit.message}
              </span>
            </div>

            {/* File search */}
            <div className="search-bar">
              <Search size={11} style={{ color: 'var(--fg-dim)', flexShrink: 0 }} />
              <input
                className="search-input"
                placeholder="Filter files…"
                value={fileSearch}
                onChange={e => setFileSearch(e.target.value)}
              />
              {fileSearch && (
                <button className="icon-btn" style={{ width: 16, height: 16 }} onClick={() => setFileSearch('')}>
                  <X size={10} />
                </button>
              )}
            </div>

            <div className="sidebar-scroll">
              {treeLoading ? (
                <div className="sidebar-empty">
                  <div className="spinner" />
                </div>
              ) : (
                <FileTree
                  files={treeFiles}
                  selectedPath={selectedFilePath}
                  onSelect={path => {
                    if (selectedCommit) {
                      openFile(path, selectedCommit.hash)
                    }
                  }}
                  searchQuery={fileSearch}
                />
              )}
            </div>
          </aside>
        )}

        {/* Toggle right sidebar button (if closed) */}
        {!rightSidebarOpen && selectedCommit && (
          <button
            className="icon-btn"
            style={{
              position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
              background: 'var(--bg-muted)', border: '1px solid var(--border)',
              borderRight: 'none', borderRadius: '4px 0 0 4px', width: 20, height: 40, zIndex: 10,
            }}
            onClick={() => setRightSidebarOpen(true)}
            title="Show file explorer"
          >
            <ChevronLeft size={12} />
          </button>
        )}
      </div>

      {/* ─── OPEN DIALOG ─── */}
      {showOpenDialog && (
        <RepoOpenDialog
          onOpen={path => {
            setShowOpenDialog(false)
            loadRepo(path)
          }}
        />
      )}
    </div>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
