import express from 'express'
import cors from 'cors'
import { simpleGit } from 'simple-git'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// ─── Helper: validate repo path ───────────────────────────────────────────────
function isValidRepo(repoPath) {
  try {
    const gitDir = path.join(repoPath, '.git')
    return fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory()
  } catch {
    return false
  }
}

// ─── GET /api/repo/info ───────────────────────────────────────────────────────
// Returns basic repo info: name, current branch, remote
app.get('/api/repo/info', async (req, res) => {
  const repoPath = req.query.path
  if (!repoPath || !isValidRepo(repoPath)) {
    return res.status(400).json({ error: 'Invalid or missing git repository path' })
  }
  try {
    const git = simpleGit(repoPath)
    const [branch, remotes, log] = await Promise.all([
      git.branchLocal(),
      git.getRemotes(true),
      git.log({ maxCount: 1 }),
    ])
    res.json({
      name: path.basename(repoPath),
      currentBranch: branch.current,
      remotes: remotes.map(r => ({ name: r.name, url: r.refs?.fetch || '' })),
      latestCommit: log.latest || null,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/repo/commits ────────────────────────────────────────────────────
// Returns all commits (or for a specific branch)
app.get('/api/repo/commits', async (req, res) => {
  const repoPath = req.query.path
  const branch = req.query.branch || 'HEAD'
  const limit = parseInt(req.query.limit || '500', 10)

  if (!repoPath || !isValidRepo(repoPath)) {
    return res.status(400).json({ error: 'Invalid or missing git repository path' })
  }
  try {
    const git = simpleGit(repoPath)
    const log = await git.log({
      [branch]: null,
      '--max-count': limit,
      '--topo-order': null,
    })
    const commits = log.all.map(c => ({
      hash: c.hash,
      shortHash: c.hash.slice(0, 7),
      message: c.message,
      author: c.author_name,
      email: c.author_email,
      date: c.date,
      refs: c.refs,
    }))
    res.json({ commits })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/repo/branches ───────────────────────────────────────────────────
app.get('/api/repo/branches', async (req, res) => {
  const repoPath = req.query.path
  if (!repoPath || !isValidRepo(repoPath)) {
    return res.status(400).json({ error: 'Invalid or missing git repository path' })
  }
  try {
    const git = simpleGit(repoPath)
    const branches = await git.branchLocal()
    res.json({
      current: branches.current,
      branches: Object.keys(branches.branches).map(name => ({
        name,
        current: branches.branches[name].current,
        commit: branches.branches[name].commit,
      })),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/repo/tree ───────────────────────────────────────────────────────
// Returns file tree at a specific commit
app.get('/api/repo/tree', async (req, res) => {
  const repoPath = req.query.path
  const commitHash = req.query.commit || 'HEAD'

  if (!repoPath || !isValidRepo(repoPath)) {
    return res.status(400).json({ error: 'Invalid or missing git repository path' })
  }
  try {
    const git = simpleGit(repoPath)
    // List all files in the tree at this commit
    const result = await git.raw(['ls-tree', '-r', '--name-only', commitHash])
    const files = result.trim().split('\n').filter(Boolean)
    res.json({ files, commit: commitHash })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/repo/file ───────────────────────────────────────────────────────
// Returns file content at a specific commit
app.get('/api/repo/file', async (req, res) => {
  const repoPath = req.query.path
  const commitHash = req.query.commit || 'HEAD'
  const filePath = req.query.file

  if (!repoPath || !isValidRepo(repoPath)) {
    return res.status(400).json({ error: 'Invalid or missing git repository path' })
  }
  if (!filePath) {
    return res.status(400).json({ error: 'Missing file path' })
  }
  try {
    const git = simpleGit(repoPath)
    const content = await git.show([`${commitHash}:${filePath}`])
    // Detect if binary by checking for null bytes in first 8000 bytes
    const isBinary = content.includes('\0')
    if (isBinary) {
      return res.json({ content: null, binary: true, size: content.length })
    }
    res.json({ content, binary: false, size: content.length })
  } catch (err) {
    // File might not exist at this commit
    res.status(404).json({ error: `File not found at commit ${commitHash}`, details: err.message })
  }
})

// ─── GET /api/repo/raw ────────────────────────────────────────────────────────
// Streams raw binary/text file data with appropriate MIME type
app.get('/api/repo/raw', (req, res) => {
  const repoPath = req.query.path
  const commitHash = req.query.commit || 'HEAD'
  const filePath = req.query.file

  if (!repoPath || !isValidRepo(repoPath)) {
    return res.status(400).send('Invalid or missing git repository path')
  }
  if (!filePath) {
    return res.status(400).send('Missing file path')
  }

  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.bmp': 'image/bmp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogv': 'video/ogg',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
  }

  const contentType = mimeTypes[ext] || 'application/octet-stream'
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`)

  const gitProcess = spawn('git', ['-C', repoPath, 'show', `${commitHash}:${filePath}`])

  gitProcess.stdout.pipe(res)

  gitProcess.stderr.on('data', (data) => {
    console.error(`git error: ${data}`)
  })

  gitProcess.on('error', (err) => {
    if (!res.headersSent) {
      res.status(500).send(`Failed to read file: ${err.message}`)
    }
  })
})

// ─── GET /api/repo/file-commits ──────────────────────────────────────────────
// Returns all commits that modified a specific file
app.get('/api/repo/file-commits', async (req, res) => {
  const repoPath = req.query.path
  const filePath = req.query.file

  if (!repoPath || !isValidRepo(repoPath)) {
    return res.status(400).json({ error: 'Invalid or missing git repository path' })
  }
  if (!filePath) {
    return res.status(400).json({ error: 'Missing file path' })
  }
  try {
    const git = simpleGit(repoPath)
    const log = await git.log({ file: filePath })
    const commits = log.all.map(c => ({
      hash: c.hash,
      shortHash: c.hash.slice(0, 7),
      message: c.message,
      author: c.author_name,
      email: c.author_email,
      date: c.date,
      refs: c.refs,
    }))
    res.json({ commits, file: filePath })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/repo/diff ───────────────────────────────────────────────────────
// Returns diff of a file between two commits
app.get('/api/repo/diff', async (req, res) => {
  const repoPath = req.query.path
  const fromCommit = req.query.from
  const toCommit = req.query.to
  const filePath = req.query.file

  if (!repoPath || !isValidRepo(repoPath)) {
    return res.status(400).json({ error: 'Invalid or missing git repository path' })
  }
  if (!filePath) {
    return res.status(400).json({ error: 'Missing file path' })
  }
  try {
    const git = simpleGit(repoPath)
    let diffArgs = ['diff', '--unified=5']
    if (fromCommit && toCommit) {
      diffArgs.push(`${fromCommit}..${toCommit}`, '--', filePath)
    } else if (fromCommit) {
      diffArgs.push(fromCommit, '--', filePath)
    } else {
      diffArgs.push('HEAD~1', 'HEAD', '--', filePath)
    }
    const diff = await git.raw(diffArgs)
    res.json({ diff })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/repo/commit-info ───────────────────────────────────────────────
// Returns detailed info about a single commit including changed files
app.get('/api/repo/commit-info', async (req, res) => {
  const repoPath = req.query.path
  const commitHash = req.query.commit

  if (!repoPath || !isValidRepo(repoPath)) {
    return res.status(400).json({ error: 'Invalid or missing git repository path' })
  }
  if (!commitHash) {
    return res.status(400).json({ error: 'Missing commit hash' })
  }
  try {
    const git = simpleGit(repoPath)
    const [show, diffStat] = await Promise.all([
      git.show(['--format=%H%n%an%n%ae%n%ai%n%s%n%b', '--name-status', commitHash]),
      git.raw(['diff-tree', '--no-commit-id', '-r', '--name-status', commitHash]).catch(() => ''),
    ])

    // Parse the output
    const lines = show.split('\n')
    const hash = lines[0]?.trim() || commitHash
    const author = lines[1]?.trim() || ''
    const email = lines[2]?.trim() || ''
    const date = lines[3]?.trim() || ''
    const subject = lines[4]?.trim() || ''
    const body = lines.slice(5).join('\n').trim()

    // Parse changed files
    const changedFiles = []
    let inFiles = false
    for (const line of lines) {
      if (line.match(/^[AMD]\s+/)) {
        inFiles = true
        const [status, ...fileParts] = line.trim().split(/\s+/)
        const file = fileParts.join(' ')
        if (file) changedFiles.push({ status, file })
      }
    }

    res.json({ hash, author, email, date, subject, body, changedFiles })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/repo/blame ─────────────────────────────────────────────────────
// Returns blame info for a file at a commit
app.get('/api/repo/blame', async (req, res) => {
  const repoPath = req.query.path
  const commitHash = req.query.commit || 'HEAD'
  const filePath = req.query.file

  if (!repoPath || !isValidRepo(repoPath)) {
    return res.status(400).json({ error: 'Invalid or missing git repository path' })
  }
  if (!filePath) {
    return res.status(400).json({ error: 'Missing file path' })
  }
  try {
    const git = simpleGit(repoPath)
    const blame = await git.raw(['blame', '--porcelain', commitHash, '--', filePath])
    
    // Parse porcelain blame output
    const lines = []
    const blameLines = blame.split('\n')
    let i = 0
    while (i < blameLines.length) {
      const line = blameLines[i]
      if (line.match(/^[0-9a-f]{40} /)) {
        const parts = line.split(' ')
        const hash = parts[0]
        const lineNum = parseInt(parts[2], 10)
        // Skip header lines until we find the content line starting with \t
        let author = ''
        let date = ''
        let summary = ''
        i++
        while (i < blameLines.length && !blameLines[i].startsWith('\t')) {
          const hLine = blameLines[i]
          if (hLine.startsWith('author ')) author = hLine.slice(7)
          else if (hLine.startsWith('author-time ')) date = new Date(parseInt(hLine.slice(12), 10) * 1000).toISOString()
          else if (hLine.startsWith('summary ')) summary = hLine.slice(8)
          i++
        }
        const content = blameLines[i]?.slice(1) || ''
        lines.push({ hash: hash.slice(0, 7), lineNum, author, date, summary, content })
      }
      i++
    }
    res.json({ blame: lines })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`FileTrack server running at http://localhost:${PORT}`)
})
