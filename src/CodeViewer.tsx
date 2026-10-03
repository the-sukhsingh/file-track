import React, { useEffect, useState, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { sql } from '@codemirror/lang-sql'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { rust } from '@codemirror/lang-rust'
import { go } from '@codemirror/lang-go'
import { php } from '@codemirror/lang-php'
import { markdown } from '@codemirror/lang-markdown'
import { yaml } from '@codemirror/lang-yaml'
import { EditorView } from '@codemirror/view'
import { getSyntaxThemeExtension } from './syntaxThemes'
import { getFileType, type FileType } from './utils'
import type { SyntaxTheme } from './ThemeContext'

interface CodeViewerProps {
  content: string | null
  fileName: string
  syntaxTheme: SyntaxTheme
  binary?: boolean
  loading?: boolean
}

function getLanguageExtension(fileType: FileType) {
  switch (fileType) {
    case 'javascript': case 'jsx': return [javascript({ jsx: true })]
    case 'typescript': case 'tsx': return [javascript({ jsx: true, typescript: true })]
    case 'python': return [python()]
    case 'css': case 'scss': return [css()]
    case 'html': return [html()]
    case 'json': return [json()]
    case 'xml': case 'svg': return [xml()]
    case 'sql': return [sql()]
    case 'java': return [java()]
    case 'cpp': case 'c': return [cpp()]
    case 'rust': return [rust()]
    case 'go': return [go()]
    case 'php': return [php()]
    case 'markdown': return [markdown()]
    case 'yaml': case 'toml': return [yaml()]
    default: return []
  }
}

// Very simple markdown → HTML
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}

interface NbCell {
  cell_type: 'code' | 'markdown' | 'raw'
  source: string | string[]
  outputs?: Array<{
    output_type: string
    text?: string | string[]
    traceback?: string[]
    data?: Record<string, string | string[]>
  }>
}

function NotebookViewer({ content, syntaxTheme }: { content: string; syntaxTheme: SyntaxTheme }) {
  const cells = useMemo<NbCell[]>(() => {
    try {
      const nb = JSON.parse(content)
      return nb.cells || []
    } catch {
      return []
    }
  }, [content])

  if (cells.length === 0) {
    return <div className="unsupported-file"><p>Empty or invalid notebook</p></div>
  }

  return (
    <div className="notebook-viewer">
      {cells.map((cell, i) => {
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source
        return (
          <div key={i} className="nb-cell">
            <div className="nb-cell-type">
              {cell.cell_type === 'code' ? '▶ Code' : cell.cell_type === 'markdown' ? '# Markdown' : 'Raw'}
            </div>
            {cell.cell_type === 'markdown' ? (
              <div
                className="nb-markdown"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(source) }}
              />
            ) : (
              <div className="nb-source">
                <CodeMirror
                  value={source}
                  extensions={[python(), ...getSyntaxThemeExtension(syntaxTheme), EditorView.editable.of(false)]}
                  readOnly
                  basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false, highlightActiveLineGutter: false }}
                />
              </div>
            )}
            {cell.outputs && cell.outputs.length > 0 && (
              <div>
                {cell.outputs.map((out, oi) => {
                  let text = ''
                  if (out.text) text = Array.isArray(out.text) ? out.text.join('') : out.text
                  else if (out.traceback) text = out.traceback.join('\n').replace(/\x1B\[[0-9;]*m/g, '')
                  else if (out.data?.['text/plain']) {
                    const plain = out.data['text/plain']
                    text = Array.isArray(plain) ? plain.join('') : plain
                  }
                  // Check for image output
                  const imgData = out.data?.['image/png']
                  if (imgData) {
                    const src = Array.isArray(imgData) ? imgData.join('') : imgData
                    return <div key={oi} className="nb-output"><img src={`data:image/png;base64,${src}`} alt="output" style={{ maxWidth: '100%' }} /></div>
                  }
                  if (!text) return null
                  return <div key={oi} className="nb-output">{text}</div>
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function CodeViewer({ content, fileName, syntaxTheme, binary = false, loading = false }: CodeViewerProps) {
  const fileType = getFileType(fileName)

  const extensions = useMemo(() => [
    ...getLanguageExtension(fileType),
    ...getSyntaxThemeExtension(syntaxTheme),
    EditorView.editable.of(false),
    EditorView.lineWrapping,
  ], [fileType, syntaxTheme])

  if (loading) {
    return (
      <div className="unsupported-file">
        <div className="spinner" />
        <p style={{ color: 'var(--fg-dim)', marginTop: 8, fontSize: 12 }}>Loading…</p>
      </div>
    )
  }

  if (binary) {
    return (
      <div className="unsupported-file">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity="0.3">
          <rect x="4" y="4" width="28" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <text x="9" y="22" fontSize="10" fill="currentColor" fontFamily="monospace">BIN</text>
        </svg>
        <p style={{ color: 'var(--fg-dim)', marginTop: 8, fontSize: 12 }}>Binary file — cannot be previewed</p>
      </div>
    )
  }

  if (content === null) {
    return (
      <div className="unsupported-file">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity="0.3">
          <path d="M6 3h18l6 6v24H6V3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M24 3v6h6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        <p style={{ color: 'var(--fg-dim)', marginTop: 8, fontSize: 12 }}>File not found at this commit</p>
      </div>
    )
  }

  if (fileType === 'image') {
    // Content from git is base64 for images... but actually git show returns binary
    // For images we just show a placeholder with info
    return (
      <div className="unsupported-file">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity="0.3">
          <rect x="3" y="7" width="30" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="11" cy="15" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 24l8-8 6 6 4-4 12 11" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        <p style={{ color: 'var(--fg-dim)', marginTop: 8, fontSize: 12 }}>
          Image file — preview not available in git history<br />
          <span style={{ fontSize: 11, opacity: 0.7 }}>{fileName}</span>
        </p>
      </div>
    )
  }

  if (fileType === 'pdf') {
    return (
      <div className="unsupported-file">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity="0.3">
          <path d="M6 3h18l6 6v24H6V3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M24 3v6h6" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <text x="9" y="24" fontSize="9" fill="currentColor" fontFamily="monospace">PDF</text>
        </svg>
        <p style={{ color: 'var(--fg-dim)', marginTop: 8, fontSize: 12 }}>PDF — cannot be previewed</p>
      </div>
    )
  }

  if (fileType === 'notebook') {
    return <NotebookViewer content={content} syntaxTheme={syntaxTheme} />
  }

  if (fileType === 'markdown') {
    return (
      <div
        className="markdown-viewer"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
      />
    )
  }

  return (
    <div className="editor-wrap">
      <CodeMirror
        value={content}
        extensions={extensions}
        readOnly
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          highlightSelectionMatches: true,
          bracketMatching: true,
        }}
        style={{ height: '100%', fontSize: '13px' }}
      />
    </div>
  )
}
