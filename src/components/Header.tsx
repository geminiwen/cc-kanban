'use client'

import { useTheme } from '@/hooks/useTheme'

interface HeaderProps {
  boardTitle?: string
  onBack?: () => void
}

export function Header({ boardTitle, onBack }: HeaderProps) {
  const { dark, toggle } = useTheme()

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center gap-4">
      {onBack && (
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm cursor-pointer"
        >
          &larr; Back
        </button>
      )}
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex-1">
        {boardTitle ?? 'Kanban Board'}
      </h1>
      <button
        onClick={toggle}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer text-lg"
        title={dark ? 'Light mode' : 'Dark mode'}
      >
        {dark ? '\u2600' : '\u263E'}
      </button>
    </header>
  )
}
