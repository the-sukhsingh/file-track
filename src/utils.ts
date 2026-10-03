export type FileType =
  | 'javascript' | 'typescript' | 'jsx' | 'tsx'
  | 'python' | 'css' | 'scss' | 'html' | 'xml'
  | 'json' | 'yaml' | 'toml' | 'markdown'
  | 'java' | 'cpp' | 'c' | 'rust' | 'go'
  | 'sql' | 'php' | 'ruby' | 'shell' | 'swift'
  | 'kotlin' | 'r' | 'julia' | 'dart' | 'scala'
  | 'notebook' | 'image' | 'video' | 'audio' | 'svg' | 'pdf' | 'binary' | 'plain'

export function getExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''
}

export function getFileType(name: string): FileType {
  const ext = getExtension(name)
  switch (ext) {
    case 'js': case 'mjs': case 'cjs': return 'javascript'
    case 'ts': case 'mts': return 'typescript'
    case 'jsx': return 'jsx'
    case 'tsx': return 'tsx'
    case 'py': case 'pyw': return 'python'
    case 'css': return 'css'
    case 'scss': case 'sass': return 'scss'
    case 'html': case 'htm': return 'html'
    case 'xml': case 'xsl': case 'xslt': return 'xml'
    case 'svg': return 'svg'
    case 'json': case 'jsonc': return 'json'
    case 'yaml': case 'yml': return 'yaml'
    case 'toml': return 'toml'
    case 'md': case 'mdx': case 'markdown': return 'markdown'
    case 'java': return 'java'
    case 'cpp': case 'cc': case 'cxx': case 'hpp': case 'hxx': return 'cpp'
    case 'c': case 'h': return 'c'
    case 'rs': return 'rust'
    case 'go': return 'go'
    case 'sql': return 'sql'
    case 'php': return 'php'
    case 'rb': case 'ruby': return 'ruby'
    case 'sh': case 'bash': case 'zsh': case 'fish': return 'shell'
    case 'swift': return 'swift'
    case 'kt': case 'kts': return 'kotlin'
    case 'r': return 'r'
    case 'jl': return 'julia'
    case 'dart': return 'dart'
    case 'scala': return 'scala'
    case 'ipynb': return 'notebook'
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': case 'bmp': case 'ico': case 'avif': return 'image'
    case 'mp4': case 'webm': case 'ogv': case 'mov': case 'mkv': return 'video'
    case 'mp3': case 'wav': case 'ogg': case 'flac': case 'm4a': case 'aac': return 'audio'
    case 'pdf': return 'pdf'
    case 'exe': case 'bin': case 'dll': case 'so': case 'dylib': case 'class': case 'wasm': return 'binary'
    default: return 'plain'
  }
}

export function getLanguageLabel(type: FileType): string {
  const labels: Record<FileType, string> = {
    javascript: 'JavaScript', typescript: 'TypeScript', jsx: 'JSX', tsx: 'TSX',
    python: 'Python', css: 'CSS', scss: 'SCSS', html: 'HTML', xml: 'XML',
    json: 'JSON', yaml: 'YAML', toml: 'TOML', markdown: 'Markdown',
    java: 'Java', cpp: 'C++', c: 'C', rust: 'Rust', go: 'Go',
    sql: 'SQL', php: 'PHP', ruby: 'Ruby', shell: 'Shell', swift: 'Swift',
    kotlin: 'Kotlin', r: 'R', julia: 'Julia', dart: 'Dart', scala: 'Scala',
    notebook: 'Jupyter Notebook', image: 'Image', video: 'Video', audio: 'Audio', svg: 'SVG',
    pdf: 'PDF Document', binary: 'Binary', plain: 'Plain Text',
  }
  return labels[type] || 'Text'
}

/** Simple relative time formatter */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) return `${years}y ago`
  if (months > 0) return `${months}mo ago`
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

/** Format date to readable string */
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

/** Get initials from a name */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('')
}

/** Build a nested file tree from a flat list of paths */
export interface TreeNode {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  children?: TreeNode[]
  expanded?: boolean
}

export function buildFileTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = []
  const folderMap = new Map<string, TreeNode>()

  const sorted = [...paths].sort()

  for (const filePath of sorted) {
    const parts = filePath.split('/')
    let currentLevel = root
    let currentPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isLast = i === parts.length - 1

      if (isLast) {
        currentLevel.push({
          id: currentPath,
          name: part,
          path: currentPath,
          type: 'file',
        })
      } else {
        if (!folderMap.has(currentPath)) {
          const folder: TreeNode = {
            id: currentPath,
            name: part,
            path: currentPath,
            type: 'folder',
            children: [],
            expanded: i < 2,
          }
          currentLevel.push(folder)
          folderMap.set(currentPath, folder)
        }
        currentLevel = folderMap.get(currentPath)!.children!
      }
    }
  }

  return sortTree(root)
}

function sortTree(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
    .map(n => ({ ...n, children: n.children ? sortTree(n.children) : undefined }))
}
