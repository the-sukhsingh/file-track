import React, { useState, useMemo } from 'react'
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
import { api } from './api'
import {
  ExternalLink,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Music,
  Video as VideoIcon,
  Image as ImageIcon,
} from 'lucide-react'

interface CodeViewerProps {
  content: string | null
  fileName: string
  filePath?: string
  repoPath?: string
  commitHash?: string
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

function ImageViewer({ rawUrl, fileName }: { rawUrl: string; fileName: string }) {
  const [zoom, setZoom] = useState(1)

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Media toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg)] text-xs text-[var(--fg-muted)]">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-[var(--accent)]" />
          <span className="font-medium text-[var(--fg)]">{fileName}</span>
          <span className="text-[10px] text-[var(--fg-dim)] bg-[var(--bg-muted)] px-1.5 py-0.5 rounded">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(z => Math.max(0.2, z - 0.25))}
            className="icon-btn icon-btn-sm"
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="icon-btn icon-btn-sm"
            title="Reset Zoom"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={() => setZoom(z => Math.min(4, z + 0.25))}
            className="icon-btn icon-btn-sm"
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn icon-btn-sm"
            title="Open in new tab"
          >
            <ExternalLink size={13} />
          </a>
          <a
            href={rawUrl}
            download={fileName}
            className="icon-btn icon-btn-sm"
            title="Download"
          >
            <Download size={13} />
          </a>
        </div>
      </div>

      {/* Image display */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]">
        <img
          src={rawUrl}
          alt={fileName}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="max-w-full max-h-full object-contain rounded transition-transform duration-100 shadow-sm border border-[var(--border-subtle)] bg-[var(--bg)]"
        />
      </div>
    </div>
  )
}

function PdfViewer({ rawUrl, fileName }: { rawUrl: string; fileName: string }) {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[var(--bg)]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg)] text-xs text-[var(--fg-muted)]">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-[var(--accent)]" />
          <span className="font-medium text-[var(--fg)]">{fileName}</span>
          <span className="text-[10px] text-[var(--fg-dim)] bg-[var(--bg-muted)] px-1.5 py-0.5 rounded">PDF</span>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn icon-btn-sm"
            title="Open PDF in new tab"
          >
            <ExternalLink size={13} />
          </a>
          <a
            href={rawUrl}
            download={fileName}
            className="icon-btn icon-btn-sm"
            title="Download PDF"
          >
            <Download size={13} />
          </a>
        </div>
      </div>
      <div className="flex-1 w-full h-full bg-neutral-900/5">
        <iframe
          src={rawUrl}
          title={fileName}
          className="w-full h-full border-none"
        />
      </div>
    </div>
  )
}

function VideoViewer({ rawUrl, fileName }: { rawUrl: string; fileName: string }) {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[var(--bg)]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg)] text-xs text-[var(--fg-muted)]">
        <div className="flex items-center gap-2">
          <VideoIcon size={14} className="text-[var(--accent)]" />
          <span className="font-medium text-[var(--fg)]">{fileName}</span>
        </div>
        <div className="flex items-center gap-1">
          <a href={rawUrl} target="_blank" rel="noopener noreferrer" className="icon-btn icon-btn-sm" title="Open in new tab">
            <ExternalLink size={13} />
          </a>
          <a href={rawUrl} download={fileName} className="icon-btn icon-btn-sm" title="Download">
            <Download size={13} />
          </a>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-black/10">
        <video
          src={rawUrl}
          controls
          className="max-w-full max-h-[80vh] rounded shadow-md bg-black"
        >
          Your browser does not support HTML5 video.
        </video>
      </div>
    </div>
  )
}

function AudioViewer({ rawUrl, fileName }: { rawUrl: string; fileName: string }) {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[var(--bg)]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg)] text-xs text-[var(--fg-muted)]">
        <div className="flex items-center gap-2">
          <Music size={14} className="text-[var(--accent)]" />
          <span className="font-medium text-[var(--fg)]">{fileName}</span>
        </div>
        <div className="flex items-center gap-1">
          <a href={rawUrl} download={fileName} className="icon-btn icon-btn-sm" title="Download">
            <Download size={13} />
          </a>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-[var(--bg-subtle)]">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-[var(--accent)]">
          <Music size={28} />
        </div>
        <div className="text-center">
          <div className="font-medium text-sm text-[var(--fg)]">{fileName}</div>
          <div className="text-xs text-[var(--fg-dim)] mt-0.5">Audio playback</div>
        </div>
        <audio src={rawUrl} controls className="w-full max-w-md mt-2" />
      </div>
    </div>
  )
}

export function CodeViewer({
  content,
  fileName,
  filePath,
  repoPath,
  commitHash,
  syntaxTheme,
  binary = false,
  loading = false,
}: CodeViewerProps) {
  const fileType = getFileType(fileName)

  const rawUrl = useMemo(() => {
    if (repoPath && commitHash && (filePath || fileName)) {
      return api.getRawFileUrl(repoPath, commitHash, filePath || fileName)
    }
    return ''
  }, [repoPath, commitHash, filePath, fileName])

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

  // 1. PDF files
  if (fileType === 'pdf' && rawUrl) {
    return <PdfViewer rawUrl={rawUrl} fileName={fileName} />
  }

  // 2. Image files
  if (fileType === 'image' && rawUrl) {
    return <ImageViewer rawUrl={rawUrl} fileName={fileName} />
  }

  // 3. Video files
  if (fileType === 'video' && rawUrl) {
    return <VideoViewer rawUrl={rawUrl} fileName={fileName} />
  }

  // 4. Audio files
  if (fileType === 'audio' && rawUrl) {
    return <AudioViewer rawUrl={rawUrl} fileName={fileName} />
  }

  // 5. Binary files
  if (binary) {
    return (
      <div className="unsupported-file">
        <div className="w-12 h-12 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-dim)] mb-2 font-mono text-xs font-semibold">
          BIN
        </div>
        <p style={{ color: 'var(--fg)', fontWeight: 500, fontSize: 13, margin: '0 0 2px' }}>{fileName}</p>
        <p style={{ color: 'var(--fg-dim)', fontSize: 12, margin: '0 0 12px' }}>Binary file — cannot be edited as text</p>
        {rawUrl && (
          <a
            href={rawUrl}
            download={fileName}
            className="open-btn flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <Download size={13} />
            Download File
          </a>
        )}
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
