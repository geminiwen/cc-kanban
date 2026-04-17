'use client'

import { useCallback, useEffect, useState } from 'react'
import { LayoutList, Moon, Plus, Sun } from 'lucide-react'
import type { Board, WsMessage } from '@/lib/types'
import { Events } from '@/lib/types'
import { listBoardsAction, createBoardAction } from '@/lib/actions'
import { useTheme } from '@/hooks/useTheme'
import { useWebSocket } from '@/hooks/useWebSocket'

interface AppSidebarProps {
  selectedBoardId: string | null
  onSelectBoard: (id: string) => void
}

export function AppSidebar({ selectedBoardId, onSelectBoard }: AppSidebarProps) {
  const [boards, setBoards] = useState<Board[]>([])
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { dark, toggle } = useTheme()

  useEffect(() => {
    listBoardsAction().then(setBoards)
  }, [])

  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (msg.event === Events.BOARD_CREATED) {
      const board = msg.data as Board
      setBoards((prev) => (prev.some((b) => b.id === board.id) ? prev : [board, ...prev]))
    }
  }, [])
  useWebSocket(handleWsMessage)

  const handleCreate = async () => {
    const trimmed = title.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      const board = await createBoardAction(trimmed)
      setBoards((prev) => (prev.some((b) => b.id === board.id) ? prev : [board, ...prev]))
      setTitle('')
      setCreating(false)
      onSelectBoard(board.id)
    } finally {
      setSubmitting(false)
    }
  }

  const cancelCreate = () => {
    setCreating(false)
    setTitle('')
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <h1 className="text-sm font-semibold tracking-tight">Kanban Board</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-sidebar-foreground/60">
            Boards
          </span>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              title="New board"
              className="size-5 inline-flex items-center justify-center rounded text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer transition-colors"
            >
              <Plus className="size-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-0.5">
          {boards.map((board) => {
            const active = board.id === selectedBoardId
            return (
              <button
                key={board.id}
                onClick={() => onSelectBoard(board.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left cursor-pointer transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'hover:bg-sidebar-accent/60'
                }`}
              >
                <LayoutList className="size-3.5 shrink-0 opacity-70" />
                <span className="truncate">{board.title}</span>
              </button>
            )
          })}

          {creating && (
            <div className="px-1 py-1">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') cancelCreate()
                }}
                onBlur={() => {
                  if (!title.trim()) cancelCreate()
                }}
                placeholder="Board title..."
                className="w-full bg-background border border-input text-foreground rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {boards.length === 0 && !creating && (
            <p className="px-2 py-1.5 text-xs text-sidebar-foreground/50">No boards yet</p>
          )}
        </div>
      </div>

      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer hover:bg-sidebar-accent/60 transition-colors"
        >
          {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          <span>{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </aside>
  )
}
