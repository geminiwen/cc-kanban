'use client'

import { useState } from 'react'
import { createCardAction } from '@/lib/actions'

interface AddCardProps {
  columnId: string
}

export function AddCard({ columnId }: AddCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    await createCardAction(columnId, { title: trimmed, description: description.trim() || undefined })
    setTitle('')
    setDescription('')
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
    setTitle('')
    setDescription('')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full text-left text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 mt-1 cursor-pointer"
      >
        + Add card
      </button>
    )
  }

  return (
    <div className="mt-1">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') handleCancel()
        }}
        placeholder="Card title..."
        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') handleCancel()
        }}
        placeholder="Description (optional)"
        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 mt-1"
        rows={2}
      />
      <div className="flex gap-2 mt-1">
        <button onClick={handleSubmit} className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600 cursor-pointer">Add</button>
        <button onClick={handleCancel} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer">Cancel</button>
      </div>
    </div>
  )
}
