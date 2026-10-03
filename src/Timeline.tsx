import React, { useRef, useEffect, useState } from 'react'
import type { CommitSummary } from './types'
import { formatDate, getInitials } from './utils'
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

  // Scroll active point into view when it changes
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
            {activeFilePath ? 'No commit history for this file' : 'Open a file to see its change history'}
          </span>
        </div>
      </div>
    )
  }

  // reversed = oldest first for display (left to right = older to newer)
  const displayCommits = [...commits].reverse()

  const activeIdx = displayCommits.findIndex(c => c.hash === activeCommitHash)

  return (
    <div className="timeline-bar">
      <div className="timeline-header">
        <span className="timeline-label">
          File Timeline
          {activeFilePath && (
            <span style={{ fontWeight: 400, marginLeft: 6, color: 'var(--fg-dim)', fontSize: 9, fontFamily: 'inherit' }}>
              {activeFilePath.split('/').pop()}
            </span>
          )}
        </span>
        <span style={{ fontSize: 11, color: 'var(--fg-dim)' }}>
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
              style={{ position: 'relative' }}
            >
              <div
                className="timeline-dot"
                onClick={() => onSelect(commit)}
              />
              <span className="timeline-point-label">{commit.shortHash}</span>

              {/* Tooltip on hover */}
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: 6,
                  background: 'var(--fg)',
                  color: 'var(--bg)',
                  borderRadius: 5,
                  padding: '6px 8px',
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                  zIndex: 100,
                  maxWidth: 220,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  pointerEvents: 'none',
                  lineHeight: 1.4,
                }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, opacity: 0.7, marginBottom: 2 }}>{commit.shortHash}</div>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{commit.message}</div>
                  <div style={{ opacity: 0.7, marginTop: 2 }}>{commit.author} · {formatDate(commit.date)}</div>
                </div>
              )}

              {/* Diff button (appears on hover, only if there's a previous commit) */}
              {isHovered && prevCommit && onDiff && (
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: 'var(--accent)',
                    color: 'white',
                    borderRadius: 4,
                    width: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    pointerEvents: 'auto',
                  }}
                  onClick={e => { e.stopPropagation(); onDiff(prevCommit, commit) }}
                  title={`Diff ${prevCommit.shortHash} → ${commit.shortHash}`}
                >
                  <Diff size={9} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
