import React, { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { FileIcon, FolderIcon } from './FileIcon'
import { buildFileTree, type TreeNode } from './utils'

interface FileTreeProps {
  files: string[]
  selectedPath?: string
  onSelect: (path: string) => void
  searchQuery?: string
}

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query) return nodes
  const q = query.toLowerCase()
  return nodes.reduce<TreeNode[]>((acc, node) => {
    if (node.type === 'file') {
      if (node.path.toLowerCase().includes(q)) acc.push(node)
    } else {
      const filtered = filterTree(node.children || [], q)
      if (filtered.length > 0) {
        acc.push({ ...node, children: filtered, expanded: true })
      }
    }
    return acc
  }, [])
}

function TreeNodeItem({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: TreeNode
  depth: number
  selectedPath?: string
  onSelect: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(node.expanded ?? false)
  const indent = depth * 12

  if (node.type === 'folder') {
    return (
      <>
        <div
          className="file-tree-item folder"
          style={{ paddingLeft: 8 + indent }}
          onClick={() => setExpanded(e => !e)}
        >
          <span className="tree-icon" style={{ color: 'var(--fg-dim)', width: 12 }}>
            {expanded
              ? <ChevronDown size={10} />
              : <ChevronRight size={10} />
            }
          </span>
          <span className="tree-icon">
            <FolderIcon size={13} open={expanded} />
          </span>
          <span className="file-tree-name">{node.name}</span>
        </div>
        {expanded && node.children?.map(child => (
          <TreeNodeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
      </>
    )
  }

  const isActive = selectedPath === node.path

  return (
    <div
      className={`file-tree-item ${isActive ? 'active' : ''}`}
      style={{ paddingLeft: 8 + indent }}
      onClick={() => onSelect(node.path)}
      title={node.path}
    >
      <span className="tree-icon" style={{ width: 12, flexShrink: 0 }} />
      <span className="tree-icon">
        <FileIcon name={node.name} size={13} />
      </span>
      <span className="file-tree-name">{node.name}</span>
    </div>
  )
}

export function FileTree({ files, selectedPath, onSelect, searchQuery = '' }: FileTreeProps) {
  const tree = useMemo(() => buildFileTree(files), [files])
  const filtered = useMemo(() => filterTree(tree, searchQuery), [tree, searchQuery])

  if (filtered.length === 0) {
    return (
      <div className="sidebar-empty">
        <p style={{ fontSize: 12, color: 'var(--fg-dim)' }}>
          {searchQuery ? 'No files match your search' : 'No files in this commit'}
        </p>
      </div>
    )
  }

  return (
    <ul className="file-tree">
      {filtered.map(node => (
        <TreeNodeItem
          key={node.id}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}
