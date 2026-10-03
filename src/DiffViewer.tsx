import React, { useMemo } from 'react'

interface DiffViewerProps {
  diff: string
  loading?: boolean
}

interface DiffLine {
  type: 'added' | 'removed' | 'context' | 'header' | 'fileheader'
  content: string
  oldNum?: number
  newNum?: number
}

function parseDiff(diff: string): DiffLine[] {
  const lines = diff.split('\n')
  const result: DiffLine[] = []
  let oldLine = 0
  let newLine = 0

  for (const line of lines) {
    if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('---') || line.startsWith('+++')) {
      result.push({ type: 'fileheader', content: line })
    } else if (line.startsWith('@@')) {
      // Parse hunk header: @@ -oldStart,oldCount +newStart,newCount @@
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (match) {
        oldLine = parseInt(match[1], 10) - 1
        newLine = parseInt(match[2], 10) - 1
      }
      result.push({ type: 'header', content: line })
    } else if (line.startsWith('+')) {
      newLine++
      result.push({ type: 'added', content: line.slice(1), newNum: newLine })
    } else if (line.startsWith('-')) {
      oldLine++
      result.push({ type: 'removed', content: line.slice(1), oldNum: oldLine })
    } else if (line.startsWith(' ') || (!line.startsWith('\\') && line.length > 0)) {
      oldLine++
      newLine++
      result.push({ type: 'context', content: line.startsWith(' ') ? line.slice(1) : line, oldNum: oldLine, newNum: newLine })
    }
  }

  return result
}

export function DiffViewer({ diff, loading = false }: DiffViewerProps) {
  const lines = useMemo(() => parseDiff(diff), [diff])

  if (loading) {
    return (
      <div className="unsupported-file">
        <div className="spinner" />
        <p style={{ color: 'var(--fg-dim)', marginTop: 8, fontSize: 12 }}>Loading diff…</p>
      </div>
    )
  }

  if (!diff || diff.trim() === '') {
    return (
      <div className="unsupported-file">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity="0.3">
          <path d="M18 3v30M3 18h30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p style={{ color: 'var(--fg-dim)', marginTop: 8, fontSize: 12 }}>No differences found between these commits</p>
      </div>
    )
  }

  return (
    <div className="diff-wrap">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {lines.map((line, i) => {
            if (line.type === 'fileheader') {
              return (
                <tr key={i}>
                  <td colSpan={3} style={{
                    padding: '2px 12px',
                    fontFamily: '"SF Mono", "Fira Code", monospace',
                    fontSize: 11,
                    color: 'var(--fg-dim)',
                    background: 'var(--bg-muted)',
                    borderTop: '1px solid var(--border-subtle)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}>
                    {line.content}
                  </td>
                </tr>
              )
            }

            if (line.type === 'header') {
              return (
                <tr key={i} className="diff-line header">
                  <td style={{
                    width: 40, padding: '2px 8px',
                    textAlign: 'right', color: 'var(--fg-dim)',
                    fontSize: 11, userSelect: 'none',
                    background: 'var(--accent-subtle)',
                  }}>···</td>
                  <td style={{
                    width: 40, padding: '2px 8px',
                    textAlign: 'right', color: 'var(--fg-dim)',
                    fontSize: 11, userSelect: 'none',
                    background: 'var(--accent-subtle)',
                  }}>···</td>
                  <td style={{
                    padding: '2px 12px',
                    fontFamily: '"SF Mono", "Fira Code", monospace',
                    fontSize: 11, color: 'var(--fg-dim)',
                    background: 'var(--accent-subtle)',
                  }}>
                    {line.content}
                  </td>
                </tr>
              )
            }

            const bg = line.type === 'added' ? 'var(--added-bg)'
              : line.type === 'removed' ? 'var(--removed-bg)'
              : 'transparent'
            const textColor = line.type === 'added' ? 'var(--added)'
              : line.type === 'removed' ? 'var(--removed)'
              : 'var(--fg)'
            const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '

            return (
              <tr key={i} style={{ background: bg }}>
                <td style={{
                  width: 40, padding: '1px 8px',
                  textAlign: 'right', color: 'var(--fg-dim)',
                  fontSize: 11, userSelect: 'none',
                  fontFamily: '"SF Mono", "Fira Code", monospace',
                }}>
                  {line.oldNum ?? ''}
                </td>
                <td style={{
                  width: 40, padding: '1px 8px',
                  textAlign: 'right', color: 'var(--fg-dim)',
                  fontSize: 11, userSelect: 'none',
                  fontFamily: '"SF Mono", "Fira Code", monospace',
                }}>
                  {line.newNum ?? ''}
                </td>
                <td style={{
                  padding: '1px 12px',
                  fontFamily: '"SF Mono", "Fira Code", monospace',
                  fontSize: 12, color: textColor,
                  whiteSpace: 'pre',
                }}>
                  <span style={{ userSelect: 'none', marginRight: 8, opacity: 0.6 }}>{prefix}</span>
                  {line.content}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
