'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { BoardList } from '@/components/BoardList'
import { Board } from '@/components/Board'
import { useBoard } from '@/hooks/useBoard'

export function HomePage() {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const { board, loading } = useBoard(selectedBoardId)

  if (!selectedBoardId) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header />
        <BoardList onSelect={setSelectedBoardId} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header boardTitle={board?.title} onBack={() => setSelectedBoardId(null)} />
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div>
      ) : board ? (
        <Board board={board} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">Board not found</div>
      )}
    </div>
  )
}
