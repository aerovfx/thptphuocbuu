'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder button with the same dimensions to prevent layout shift
    return (
      <button
        className="fixed bottom-6 right-6 z-50 p-4 bg-bluelock-green dark:bg-gray-800 rounded-full shadow-bluelock-glow dark:shadow-lg transition-all duration-300"
        aria-label="Toggle theme"
        disabled
      >
        <Moon size={24} />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-50 p-4 bg-bluelock-green dark:bg-gray-800 hover:bg-bluelock-green-bright dark:hover:bg-gray-700 text-black dark:text-white rounded-full shadow-bluelock-glow dark:shadow-lg transition-all duration-300 group"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun size={24} className="group-hover:rotate-180 transition-transform duration-300" />
      ) : (
        <Moon size={24} className="group-hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  )
}

