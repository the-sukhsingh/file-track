import React, { useMemo } from 'react'
import type { CommitSummary } from './types'
import { formatRelativeTime, getInitials } from './utils'
import { GitCommit } from 'lucide-react'

interface CommitListProps {
  commits: CommitSummary[]
  selectedHash?: string
  onSelect: (commit: CommitSummary) => void
  searchQuery?: string
}

function parseRefs(refs: string): string[] {
  if (!refs) return []
  return refs.split(',').map(r => r.trim()).filter(Boolean)
}

export function CommitList({ commits, selectedHash, onSelect, searchQuery = '' }: CommitListProps) {
  const filtered = useMemo(() => {
    if (!searchQuery) return commits
    const q = searchQuery.toLowerCase()
    return commits.filter(c =>
      c.message.toLowerCase().includes(q) ||
      c.author.toLowerCase().includes(q) ||
      c.shortHash.toLowerCase().includes(q)
    )
  }, [commits, searchQuery])

  if (filtered.length === 0) {
    return (
      <div className="sidebar-empty">
        <GitCommit size={24} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: 11.5 }}>
          {searchQuery ? 'No commits match your search' : 'No commits found'}
        </p>
      </div>
    )
  }

  return (
    <ul className="commit-list">
      {filtered.map(commit => {
        const refs = parseRefs(commit.refs)
        const isActive = commit.hash === selectedHash

        return (
          <li
            key={commit.hash}
            className={`commit-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(commit)}
            title={commit.message}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="commit-hash">{commit.shortHash}</span>
              {refs.slice(0, 2).map(ref => (
                <span key={ref} className="ref-tag truncate max-w-[120px]">
                  {ref.replace('HEAD -> ', '').replace('origin/', '')}
                </span>
              ))}
            </div>
            <div className="commit-msg">{commit.message}</div>
            <div className="commit-meta">
              <span className="commit-author">
                <span className="commit-avatar">{getInitials(commit.author)}</span>
                <span className="truncate max-w-[95px]">
                  {commit.author}
                </span>
              </span>
              <span className="shrink-0 text-[10px] opacity-75">{formatRelativeTime(commit.date)}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
