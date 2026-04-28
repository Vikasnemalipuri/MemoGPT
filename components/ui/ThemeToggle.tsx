'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const icons = {
    light: <Sun className="w-3.5 h-3.5" />,
    dark: <Moon className="w-3.5 h-3.5" />,
    system: <Monitor className="w-3.5 h-3.5" />,
  }

  const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'

  return (
    <button
      onClick={() => setTheme(next)}
      className="btn-ghost p-1.5"
      title={`Theme: ${theme}`}
    >
      {icons[theme as keyof typeof icons] ?? icons.dark}
    </button>
  )
}
