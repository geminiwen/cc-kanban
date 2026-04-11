'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BoardWithColumns, Card, Column, WsMessage } from '@/lib/types'
import { getBoardAction } from '@/lib/actions'
import { useWebSocket } from './useWebSocket'

export function useBoard(boardId: string | null) {
  const [board, setBoard] = useState<BoardWithColumns | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchBoard = useCallback(async () => {
    if (!boardId) { setBoard(null); return }
    setLoading(true)
    const data = await getBoardAction(boardId)
    setBoard(data)
    setLoading(false)
  }, [boardId])

  useEffect(() => { fetchBoard() }, [fetchBoard])

  const handleWsMessage = useCallback((msg: WsMessage) => {
    setBoard((prev) => {
      if (!prev) return prev
      const { event, data } = msg
      switch (event) {
        case 'card:created': {
          const card = data as Card
          return { ...prev, columns: prev.columns.map((col) =>
            col.id === card.column_id ? { ...col, cards: [...col.cards, card] } : col
          )}
        }
        case 'card:updated': {
          const card = data as Card
          return { ...prev, columns: prev.columns.map((col) => ({
            ...col, cards: col.cards.map((c) => c.id === card.id ? card : c)
          }))}
        }
        case 'card:moved': {
          const card = data as Card
          return { ...prev, columns: prev.columns.map((col) => ({
            ...col, cards: col.id === card.column_id
              ? [...col.cards.filter((c) => c.id !== card.id), card].sort((a, b) => a.position - b.position)
              : col.cards.filter((c) => c.id !== card.id)
          }))}
        }
        case 'card:deleted': {
          const { id } = data as { id: string }
          return { ...prev, columns: prev.columns.map((col) => ({
            ...col, cards: col.cards.filter((c) => c.id !== id)
          }))}
        }
        case 'column:created': {
          const col = data as Column
          if (col.board_id !== prev.id) return prev
          return { ...prev, columns: [...prev.columns, { ...col, cards: [] }] }
        }
        case 'column:renamed': {
          const col = data as Column
          return { ...prev, columns: prev.columns.map((c) => c.id === col.id ? { ...c, title: col.title, description: col.description } : c) }
        }
        case 'column:deleted': {
          const { id } = data as { id: string }
          return { ...prev, columns: prev.columns.filter((c) => c.id !== id) }
        }
        case 'columns:reordered': {
          const { columns } = data as { board_id: string; columns: Column[] }
          return { ...prev, columns: prev.columns
            .map((col) => { const u = columns.find((c) => c.id === col.id); return u ? { ...col, position: u.position } : col })
            .sort((a, b) => a.position - b.position)
          }
        }
        default: return prev
      }
    })
  }, [])

  useWebSocket(handleWsMessage)

  return { board, loading, refetch: fetchBoard }
}
