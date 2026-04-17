'use client'

import {
  DndContext, DragOverlay, pointerWithin, closestCenter, PointerSensor,
  useSensor, useSensors,
  type CollisionDetection, type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { BoardWithColumns, Card as CardType } from '@/lib/types'
import { buildIdentifierMap } from '@/lib/cardIdentifier'
import { Column } from './Column'
import { AddColumn } from './AddColumn'
import { moveCardAction } from '@/lib/actions'

interface BoardProps {
  board: BoardWithColumns
}

const COLUMN_PREFIX = 'column:'

function buildColumnMap(board: BoardWithColumns): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const col of board.columns) map[col.id] = col.cards.map((c) => c.id)
  return map
}

function findColumn(cols: Record<string, string[]>, id: string): string | null {
  if (id.startsWith(COLUMN_PREFIX)) return id.slice(COLUMN_PREFIX.length)
  for (const [colId, cardIds] of Object.entries(cols)) {
    if (cardIds.includes(id)) return colId
  }
  return null
}

// Prefer card droppables over column droppables so dragging inside a column
// lands on the hovered card (right index) rather than always appending.
const kanbanCollision: CollisionDetection = (args) => {
  const pointer = pointerWithin(args)
  if (pointer.length > 0) {
    const cards = pointer.filter((c) => !String(c.id).startsWith(COLUMN_PREFIX))
    if (cards.length > 0) return cards
  }
  return closestCenter(args)
}

export function Board({ board }: BoardProps) {
  const [activeCard, setActiveCard] = useState<CardType | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const [columns, setColumns] = useState<Record<string, string[]>>(() => buildColumnMap(board))
  const columnsRef = useRef(columns)
  columnsRef.current = columns

  const isDraggingRef = useRef(false)
  const recentlyMovedRef = useRef(false)

  const cardMap = useMemo(() => {
    const m = new Map<string, CardType>()
    for (const col of board.columns) for (const card of col.cards) m.set(card.id, card)
    return m
  }, [board.columns])

  const identifierMap = useMemo(() => buildIdentifierMap(board), [board])
  const cardMapRef = useRef(cardMap)
  if (!isDraggingRef.current) cardMapRef.current = cardMap

  // Sync server state -> local column order when not actively dragging.
  useEffect(() => {
    if (!isDraggingRef.current) setColumns(buildColumnMap(board))
  }, [board])

  // Release the cross-column lock after one animation frame to prevent
  // dnd-kit collision oscillation (A -> B -> A -> B) after a cross-column swap.
  useEffect(() => {
    const id = requestAnimationFrame(() => { recentlyMovedRef.current = false })
    return () => cancelAnimationFrame(id)
  }, [columns])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    isDraggingRef.current = true
    const data = event.active.data.current
    if (data?.type === 'card') setActiveCard(data.card as CardType)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over || recentlyMovedRef.current) return
    const activeId = active.id as string
    const overId = over.id as string
    setColumns((prev) => {
      const activeCol = findColumn(prev, activeId)
      const overCol = findColumn(prev, overId)
      if (!activeCol || !overCol || activeCol === overCol) return prev
      recentlyMovedRef.current = true
      const oldIds = prev[activeCol]!.filter((id) => id !== activeId)
      const newIds = [...prev[overCol]!]
      const overIndex = newIds.indexOf(overId)
      const insertIndex = overIndex >= 0 ? overIndex : newIds.length
      newIds.splice(insertIndex, 0, activeId)
      return { ...prev, [activeCol]: oldIds, [overCol]: newIds }
    })
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    isDraggingRef.current = false
    setActiveCard(null)

    const resetLocal = () => setColumns(buildColumnMap(board))
    if (!over) { resetLocal(); return }

    const activeId = active.id as string
    const overId = over.id as string
    const cols = columnsRef.current

    const activeCol = findColumn(cols, activeId)
    const overCol = findColumn(cols, overId)
    if (!activeCol || !overCol) { resetLocal(); return }

    let finalCols = cols
    if (activeCol === overCol) {
      const ids = cols[activeCol]!
      const oldIndex = ids.indexOf(activeId)
      const newIndex = overId.startsWith(COLUMN_PREFIX) ? ids.length - 1 : ids.indexOf(overId)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        finalCols = { ...cols, [activeCol]: arrayMove(ids, oldIndex, newIndex) }
        setColumns(finalCols)
      }
    }

    const finalCol = findColumn(finalCols, activeId)
    if (!finalCol) { resetLocal(); return }

    const finalIds = finalCols[finalCol]!
    const newPosition = finalIds.indexOf(activeId)
    const original = cardMapRef.current.get(activeId)
    if (original && original.column_id === finalCol && original.position === newPosition) return

    await moveCardAction(activeId, finalCol, newPosition)
  }, [board])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={kanbanCollision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 overflow-x-auto h-full items-start">
        {board.columns.map((column) => {
          const cardIds = columns[column.id] ?? column.cards.map((c) => c.id)
          const orderedCards = cardIds.flatMap((id) => {
            const c = cardMapRef.current.get(id)
            return c ? [c] : []
          })
          return (
            <Column
              key={column.id}
              column={{ ...column, cards: orderedCards }}
              identifierMap={identifierMap}
            />
          )
        })}
        <AddColumn boardId={board.id} />
      </div>
      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div className="w-[280px] rotate-2 scale-105 cursor-grabbing opacity-90 shadow-lg shadow-black/10 rounded-lg border-[0.5px] border-border bg-card py-3 px-2.5">
            <p className="text-sm font-medium leading-snug text-foreground line-clamp-2">{activeCard.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
