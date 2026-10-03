# FileTrack 🔍

A clean, modern web application for tracking and exploring file contents across Git commits and visualizing file evolution over time.

## Features

- **Commit Explorer**: Browse and search full repository commit history with author, date, and changed files metadata.
- **Commit-Specific File Tree**: Explore directory structures at any given commit point.
- **Multi-Tab File Viewer**: Open multiple files and compare different versions of the same file simultaneously.
- **Interactive File Timeline**: Visualize checkpoints where the currently open file was modified with quick diff triggers.
- **Unified Diff Viewer**: Side-by-side / inline git diff comparisons across commit revisions.
- **Rich Syntax Highlighting**: Powered by CodeMirror with support for TypeScript, JavaScript, Python, C++, Rust, Go, SQL, JSON, YAML, Markdown, Jupyter Notebooks (`.ipynb`), images, and more.
- **Theming**: Neutral minimalist aesthetics with light/dark theme toggle and selectable syntax themes.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Git installed on your system

### Installation & Run

1. Clone or navigate to the project directory:
   ```bash
   cd file-track
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start both the client and backend server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.
