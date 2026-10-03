import React from 'react'
import { getExtension } from './utils'

interface FileIconProps {
  name: string
  size?: number
}

// Map extensions to colors/icons
function getIconInfo(name: string): { char: string; color: string } {
  const ext = getExtension(name)
  const lower = name.toLowerCase()

  // Special names
  if (lower === 'package.json') return { char: '⬡', color: '#e8c000' }
  if (lower === 'tsconfig.json' || lower.startsWith('tsconfig')) return { char: '⬡', color: '#3178c6' }
  if (lower === '.gitignore' || lower === '.gitattributes') return { char: '⎇', color: '#f05032' }
  if (lower === 'dockerfile' || lower.startsWith('dockerfile')) return { char: '⬛', color: '#2496ed' }
  if (lower === 'readme.md') return { char: '⚑', color: '#0080ff' }

  switch (ext) {
    // Web
    case 'ts': return { char: 'TS', color: '#3178c6' }
    case 'tsx': return { char: 'TX', color: '#3178c6' }
    case 'js': return { char: 'JS', color: '#f0db4f' }
    case 'jsx': return { char: 'JX', color: '#f0db4f' }
    case 'mjs': case 'cjs': return { char: 'JS', color: '#f0db4f' }
    case 'html': case 'htm': return { char: '◈', color: '#e34c26' }
    case 'css': return { char: '◈', color: '#264de4' }
    case 'scss': case 'sass': return { char: '◈', color: '#cc6699' }
    case 'vue': return { char: '◈', color: '#42b883' }
    case 'svelte': return { char: '◈', color: '#ff3e00' }
    // Data
    case 'json': case 'jsonc': return { char: '{}', color: '#f0a500' }
    case 'yaml': case 'yml': return { char: '≡', color: '#cb171e' }
    case 'toml': return { char: '≡', color: '#9c4221' }
    case 'xml': case 'xsl': return { char: '◁▷', color: '#f0a500' }
    case 'csv': return { char: '⊞', color: '#22c55e' }
    // Languages
    case 'py': case 'pyw': return { char: 'PY', color: '#3776ab' }
    case 'rs': return { char: 'RS', color: '#ce412b' }
    case 'go': return { char: 'GO', color: '#00add8' }
    case 'java': return { char: 'JV', color: '#f89820' }
    case 'cpp': case 'cc': case 'cxx': case 'hpp': return { char: 'C+', color: '#00599c' }
    case 'c': case 'h': return { char: 'C', color: '#a8b9cc' }
    case 'cs': return { char: 'C#', color: '#68217a' }
    case 'php': return { char: 'PH', color: '#777bb4' }
    case 'rb': return { char: 'RB', color: '#cc342d' }
    case 'swift': return { char: 'SW', color: '#fa7343' }
    case 'kt': case 'kts': return { char: 'KT', color: '#7f52ff' }
    case 'dart': return { char: 'DT', color: '#0175c2' }
    case 'scala': return { char: 'SC', color: '#de3423' }
    case 'r': return { char: 'R', color: '#276dc3' }
    case 'jl': return { char: 'JL', color: '#9558b2' }
    case 'lua': return { char: 'LU', color: '#000080' }
    case 'ex': case 'exs': return { char: 'EX', color: '#6e4a7e' }
    case 'sh': case 'bash': case 'zsh': return { char: '$_', color: '#89e051' }
    case 'ps1': return { char: 'PS', color: '#012456' }
    // Docs
    case 'md': case 'mdx': case 'markdown': return { char: 'MD', color: '#083fa1' }
    case 'pdf': return { char: '⬚', color: '#ff0000' }
    case 'txt': return { char: '⬚', color: '#888' }
    // Media
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': case 'bmp': case 'ico': return { char: '⊡', color: '#9b59b6' }
    case 'svg': return { char: 'SV', color: '#ffb13b' }
    case 'mp4': case 'mov': case 'avi': case 'webm': return { char: '▶', color: '#e74c3c' }
    case 'mp3': case 'wav': case 'ogg': case 'flac': return { char: '♪', color: '#1db954' }
    // Notebooks
    case 'ipynb': return { char: '◎', color: '#f37626' }
    // Config
    case 'env': return { char: '⚙', color: '#ecc94b' }
    case 'gitignore': return { char: '⎇', color: '#f05032' }
    case 'lock': return { char: '🔒', color: '#888' }
    case 'sql': return { char: 'SQ', color: '#336791' }
    default: return { char: '⬚', color: '#888' }
  }
}

export function FileIcon({ name, size = 14 }: FileIconProps) {
  const { char, color } = getIconInfo(name)
  const fontSize = char.length > 2 ? size * 0.5 : size * 0.6

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        fontSize,
        fontWeight: 700,
        color,
        fontFamily: '"SF Mono", "Fira Code", monospace',
        letterSpacing: '-0.05em',
        flexShrink: 0,
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {char}
    </span>
  )
}

export function FolderIcon({ size = 14, open = false }: { size?: number; open?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      {open ? (
        <>
          <path d="M1 4h5l1.5 2H15v8H1V4z" fill="#dcb67a" opacity="0.9" />
          <path d="M1 6h14v6H1V6z" fill="#dcb67a" />
        </>
      ) : (
        <>
          <path d="M1 4h5l1.5 2H15v8H1V4z" fill="#dcb67a" opacity="0.7" />
          <path d="M1 6h14v6H1V6z" fill="#dcb67a" opacity="0.9" />
        </>
      )}
    </svg>
  )
}
