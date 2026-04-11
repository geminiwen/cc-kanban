'use client'

import { useState, useEffect } from 'react'
import type { Board } from '@/lib/types'
import { listBoardsAction, createBoardAction } from '@/lib/actions'

interface BoardListProps {
  onSelect: (id: string) => void
}

export function BoardList({ onSelect }: BoardListProps) {
  const [boards, setBoards] = useState<Board[]>([])
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    listBoardsAction().then(setBoards)
  }, [])

  const handleCreate = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    const board = await createBoardAction(trimmed)
    setBoards((prev) => [board, ...prev])
    setTitle('')
    setCreating(false)
    onSelect(board.id)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Boards</h2>
      <div className="grid grid-cols-2 gap-4">
        {boards.map((board) => (
          <button key={board.id} onClick={() => onSelect(board.id)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-left hover:shadow-md transition-shadow cursor-pointer">
            <h3 className="font-semibold text-gray-800">{board.title}</h3>
            {board.description && <p className="text-sm text-gray-500 mt-1">{board.description}</p>}
          </button>
        ))}
        {creating ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setTitle('') } }}
              placeholder="Board title..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600 cursor-pointer">Create</button>
              <button onClick={() => { setCreating(false); setTitle('') }} className="text-sm text-gray-500 cursor-pointer">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setCreating(true)}
            className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors cursor-pointer">
            + Create board
          </button>
        )}
      </div>
    </div>
  )
}
