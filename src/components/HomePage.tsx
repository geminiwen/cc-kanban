'use client'

import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/AppSidebar'
import { Board } from '@/components/Board'
import { useBoard } from '@/hooks/useBoard'

const STORAGE_KEY = 'cc-kanban:selectedBoardId'

export function HomePage() {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const { board, loading } = useBoard(selectedBoardId)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setSelectedBoardId(stored)
  }, [])

  const handleSelectBoard = (id: string) => {
    setSelectedBoardId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return (
    <div className="h-screen flex bg-background text-foreground">
      <AppSidebar selectedBoardId={selectedBoardId} onSelectBoard={handleSelectBoard} />
      <main className="flex-1 min-w-0 flex flex-col">
        {selectedBoardId ? (
          loading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : board ? (
            <>
              <div className="h-14 shrink-0 flex items-center px-6 border-b border-border">
                <h2 className="text-base font-semibold tracking-tight">{board.title}</h2>
              </div>
              <div className="flex-1 min-h-0">
                <Board board={board} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Board not found
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select or create a board to get started
          </div>
        )}
      </main>
    </div>
  )
}
