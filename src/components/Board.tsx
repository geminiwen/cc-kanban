'use client'

import {
  DndContext, DragOverlay, closestCorners, PointerSensor,
  useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import type { BoardWithColumns, Card as CardType } from '@/lib/types'
import { Column } from './Column'
import { AddColumn } from './AddColumn'
import { moveCardAction } from '@/lib/actions'

interface BoardProps {
  board: BoardWithColumns
}

export function Board({ board }: BoardProps) {
  const [activeCard, setActiveCard] = useState<CardType | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const findColumnByCardId = (cardId: string) => {
    for (const col of board.columns) {
      if (col.cards.some((c) => c.id === cardId)) return col
    }
    return null
  }

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.type === 'card') setActiveCard(data.card as CardType)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    if (activeData?.type !== 'card') return

    const cardId = active.id as string
    let targetColumnId: string
    let position: number

    const overId = over.id as string
    if (overId.startsWith('column:')) {
      targetColumnId = overId.replace('column:', '')
      const targetCol = board.columns.find((c) => c.id === targetColumnId)
      position = targetCol?.cards.length ?? 0
    } else {
      const overData = over.data.current
      if (overData?.type === 'card') {
        const overCard = overData.card as CardType
        targetColumnId = overCard.column_id
        const targetCol = board.columns.find((c) => c.id === targetColumnId)
        position = targetCol?.cards.findIndex((c) => c.id === overCard.id) ?? 0
      } else {
        return
      }
    }

    const sourceCol = findColumnByCardId(cardId)
    if (sourceCol?.id === targetColumnId && sourceCol?.cards.findIndex((c) => c.id === cardId) === position) return

    await moveCardAction(cardId, targetColumnId, position)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-6 overflow-x-auto h-[calc(100vh-56px)] items-start">
        {board.columns.map((column) => <Column key={column.id} column={column} />)}
        <AddColumn boardId={board.id} />
      </div>
      <DragOverlay>
        {activeCard ? (
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-blue-300 dark:border-blue-500 p-3 w-72 opacity-90">
            <p className="text-sm text-gray-800 dark:text-gray-100">{activeCard.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
