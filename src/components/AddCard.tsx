'use client'

import { useState } from 'react'
import { createCardAction } from '@/lib/actions'

interface AddCardProps {
  columnId: string
}

export function AddCard({ columnId }: AddCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    await createCardAction(columnId, { title: trimmed })
    setTitle('')
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full text-left text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded px-2 py-1 mt-1 cursor-pointer"
      >
        + Add card
      </button>
    )
  }

  return (
    <div className="mt-1">
      <textarea
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
          if (e.key === 'Escape') { setIsOpen(false); setTitle('') }
        }}
        placeholder="Enter card title..."
        className="w-full border border-gray-300 rounded p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        rows={2}
      />
      <div className="flex gap-2 mt-1">
        <button onClick={handleSubmit} className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600 cursor-pointer">Add</button>
        <button onClick={() => { setIsOpen(false); setTitle('') }} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Cancel</button>
      </div>
    </div>
  )
}
