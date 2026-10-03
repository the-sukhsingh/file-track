import React, { useRef, useEffect, useState } from 'react'
import type { CommitSummary } from './types'
import { formatDate } from './utils'
import { Diff } from 'lucide-react'

interface TimelineProps {
  commits: CommitSummary[]
  activeCommitHash: string | undefined
  activeFilePath?: string
  onSelect: (commit: CommitSummary) => void
  onDiff?: (fromCommit: CommitSummary, toCommit: CommitSummary) => void
}

export function Timeline({ commits, activeCommitHash, activeFilePath, onSelect, onDiff }: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  const [hoveredHash, setHoveredHash] = useState<string | null>(null)

  // Scroll active point smoothly into view when active commit changes
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeCommitHash])

  if (commits.length === 0) {
    return (
      <div className="timeline-bar">
        <div className="timeline-header">
          <span className="timeline-label">File Timeline</span>
        </div>
        <div className="timeline-track">
          <span className="timeline-empty">
            {activeFilePath ? 'No commit history found for this file' : 'Open a file to explore its commit timeline'}
          </span>
        </div>
      </div>
    )
  }

  // Oldest first for chronological left-to-right progression
  const displayCommits = [...commits].reverse()

  return (
    <div className="timeline-bar">
      <div className="timeline-header">
        <div className="flex items-center gap-1.5">
          <span className="timeline-label">File Timeline</span>
          {activeFilePath && (
            <span className="text-[10px] text-[var(--fg-dim)] font-mono opacity-80">
              · {activeFilePath.split('/').pop()}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium text-[var(--fg-dim)]">
          {commits.length} change{commits.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="timeline-track" ref={trackRef}>
        <div className="timeline-line" />
        {displayCommits.map((commit, i) => {
          const isActive = commit.hash === activeCommitHash
          const isHovered = commit.hash === hoveredHash
          const prevCommit = i > 0 ? displayCommits[i - 1] : null

          return (
            <div
              key={commit.hash}
              ref={isActive ? activeRef : undefined}
              className={`timeline-point ${isActive ? 'active' : ''}`}
              onMouseEnter={() => setHoveredHash(commit.hash)}
              onMouseLeave={() => setHoveredHash(null)}
            >
              <div
                className="timeline-dot"
                onClick={() => onSelect(commit)}
                role="button"
                tabIndex={0}
                aria-label={`Jump to commit ${commit.shortHash}`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelect(commit)
                  }
                }}
              />
              <span className="timeline-point-label">{commit.shortHash}</span>

              {/* Floating Apple-Style Hover Card */}
              {isHovered && (
                <div
                  className="fade-in pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 min-w-[180px] max-w-[240px] rounded-lg p-2.5 shadow-lg border border-[var(--border)] bg-[var(--bg-translucent)] backdrop-blur-xl text-left"
                  style={{ transformOrigin: 'bottom center' }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-[var(--accent)]">
                      {commit.shortHash}
                    </span>
                    <span className="text-[9.5px] text-[var(--fg-dim)]">
                      {formatDate(commit.date)}
                    </span>
                  </div>
                  <div className="text-[11.5px] font-medium text-[var(--fg)] leading-snug line-clamp-2">
                    {commit.message}
                  </div>
                  <div className="mt-1 text-[10px] text-[var(--fg-muted)] truncate">
                    {commit.author}
                  </div>
                </div>
              )}

              {/* Quick Diff Action Button */}
              {isHovered && prevCommit && onDiff && (
                <button
                  className="absolute -top-1 -right-1 w-4 h-4 rounded bg-[var(--accent)] text-white flex items-center justify-center cursor-pointer z-20 shadow-sm transition-transform duration-100 hover:scale-110 active:scale-95 border-none"
                  onClick={e => {
                    e.stopPropagation()
                    onDiff(prevCommit, commit)
                  }}
                  title={`View Diff with ${prevCommit.shortHash}`}
                >
                  <Diff size={9} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
