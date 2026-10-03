import React, { createContext, useContext, useState, useEffect } from 'react'

export type Theme = 'light' | 'dark'
export type SyntaxTheme =
  | 'oneDark' | 'githubLight' | 'githubDark' | 'dracula'
  | 'monokai' | 'solarizedLight' | 'nord' | 'okaidia' | 'tomorrow'

interface ThemeContextValue {
  theme: Theme
  syntaxTheme: SyntaxTheme
  setTheme: (t: Theme) => void
  setSyntaxTheme: (t: SyntaxTheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  syntaxTheme: 'oneDark',
  setTheme: () => {},
  setSyntaxTheme: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('ft-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [syntaxTheme, setSyntaxThemeState] = useState<SyntaxTheme>(() => {
    return (localStorage.getItem('ft-syntax-theme') as SyntaxTheme) || 'oneDark'
  })

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('ft-theme', t)
  }

  const setSyntaxTheme = (t: SyntaxTheme) => {
    setSyntaxThemeState(t)
    localStorage.setItem('ft-syntax-theme', t)
  }

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, syntaxTheme, setTheme, setSyntaxTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export const SYNTAX_THEMES: Array<{ id: SyntaxTheme; label: string }> = [
  { id: 'oneDark', label: 'One Dark' },
  { id: 'githubLight', label: 'GitHub Light' },
  { id: 'githubDark', label: 'GitHub Dark' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'monokai', label: 'Monokai' },
  { id: 'solarizedLight', label: 'Solarized Light' },
  { id: 'nord', label: 'Nord' },
  { id: 'okaidia', label: 'Okaidia' },
  { id: 'tomorrow', label: 'Tomorrow' },
]
