'use client'

import { useState } from 'react'
import { createColumnAction } from '@/lib/actions'

interface AddColumnProps {
  boardId: string
}

export function AddColumn({ boardId }: AddColumnProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    await createColumnAction(boardId, trimmed)
    setTitle('')
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <div className="flex-shrink-0 w-72">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-white/60 hover:bg-white/80 rounded-lg p-3 text-sm text-gray-600 hover:text-gray-800 text-left border border-dashed border-gray-300 cursor-pointer"
        >
          + Add column
        </button>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 w-72 bg-white rounded-lg p-3 shadow-sm">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') { setIsOpen(false); setTitle('') }
        }}
        placeholder="Column title..."
        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <div className="flex gap-2 mt-2">
        <button onClick={handleSubmit} className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600 cursor-pointer">Add</button>
        <button onClick={() => { setIsOpen(false); setTitle('') }} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Cancel</button>
      </div>
    </div>
  )
}
