import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { Extension } from '@codemirror/state'
import type { SyntaxTheme } from './ThemeContext'

const transparent = (dark: boolean) => EditorView.theme({
  '&': { backgroundColor: 'transparent' },
  '.cm-gutters': { backgroundColor: 'transparent', border: 'none' },
  '.cm-activeLineGutter': { backgroundColor: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
  '.cm-activeLine': { backgroundColor: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
}, { dark })

const githubLight = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: '#24292f' },
  '.cm-gutters': { backgroundColor: 'transparent', color: '#6e7781', border: 'none' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(0,0,0,0.04)' },
  '.cm-activeLine': { backgroundColor: 'rgba(0,0,0,0.03)' },
  '.cm-selectionBackground, ::selection': { backgroundColor: '#b6d7ff' },
}, { dark: false })

const githubDark = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: '#e6edf3' },
  '.cm-gutters': { backgroundColor: 'transparent', color: '#6e7681', border: 'none' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(255,255,255,0.04)' },
  '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.03)' },
  '.cm-selectionBackground, ::selection': { backgroundColor: '#388bfd33' },
}, { dark: true })

const dracula = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: '#f8f8f2' },
  '.cm-gutters': { backgroundColor: 'transparent', color: '#6272a4', border: 'none' },
  '.cm-selectionBackground, ::selection': { backgroundColor: '#44475a' },
  '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.03)' },
}, { dark: true })

const monokai = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: '#f8f8f2' },
  '.cm-gutters': { backgroundColor: 'transparent', color: '#75715e', border: 'none' },
  '.cm-selectionBackground, ::selection': { backgroundColor: '#49483e' },
  '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.04)' },
}, { dark: true })

const solarizedLight = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: '#657b83' },
  '.cm-gutters': { backgroundColor: 'transparent', color: '#93a1a1', border: 'none' },
  '.cm-selectionBackground, ::selection': { backgroundColor: '#eee8d5' },
  '.cm-activeLine': { backgroundColor: 'rgba(0,0,0,0.03)' },
}, { dark: false })

const nord = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: '#d8dee9' },
  '.cm-gutters': { backgroundColor: 'transparent', color: '#4c566a', border: 'none' },
  '.cm-selectionBackground, ::selection': { backgroundColor: '#3b4252' },
  '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.03)' },
}, { dark: true })

const okaidia = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: '#f8f8f2' },
  '.cm-gutters': { backgroundColor: 'transparent', color: '#999', border: 'none' },
  '.cm-selectionBackground, ::selection': { backgroundColor: '#3e3e3e' },
  '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.04)' },
}, { dark: true })

const tomorrow = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: '#4d4d4c' },
  '.cm-gutters': { backgroundColor: 'transparent', color: '#8e908c', border: 'none' },
  '.cm-selectionBackground, ::selection': { backgroundColor: '#d6d6d6' },
  '.cm-activeLine': { backgroundColor: 'rgba(0,0,0,0.03)' },
}, { dark: false })

export function getSyntaxThemeExtension(theme: SyntaxTheme): Extension[] {
  switch (theme) {
    case 'oneDark': return [oneDark, transparent(true)]
    case 'githubLight': return [githubLight]
    case 'githubDark': return [githubDark]
    case 'dracula': return [dracula]
    case 'monokai': return [monokai]
    case 'solarizedLight': return [solarizedLight]
    case 'nord': return [nord]
    case 'okaidia': return [okaidia]
    case 'tomorrow': return [tomorrow]
    default: return [oneDark, transparent(true)]
  }
}
