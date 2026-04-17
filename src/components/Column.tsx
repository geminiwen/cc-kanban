'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ColumnWithCards } from '@/lib/types'
import { resolveColumnTheme } from '@/lib/columnTheme'
import { CardItem } from './CardItem'
import { AddCard } from './AddCard'
import { ColumnModal } from './ColumnModal'
import { deleteColumnAction } from '@/lib/actions'

interface ColumnProps {
  column: ColumnWithCards
  identifierMap: Map<string, string>
}

export function Column({ column, identifierMap }: ColumnProps) {
  const [showModal, setShowModal] = useState(false)
  const theme = useMemo(() => resolveColumnTheme(column.title), [column.title])

  const { setNodeRef, isOver } = useDroppable({
    id: `column:${column.id}`,
    data: { type: 'column', columnId: column.id },
  })

  const handleDelete = async () => {
    await deleteColumnAction(column.id)
  }

  const cardIds = column.cards.map((c) => c.id)

  return (
    <>
      <div className="flex-shrink-0 w-[280px] bg-muted/50 rounded-xl p-2 flex flex-col max-h-full">
        <div className="flex items-center justify-between mb-2 px-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold cursor-pointer select-none ${theme.badge}`}
              onDoubleClick={() => setShowModal(true)}
              title="Double-click to edit"
            >
              <span className={`size-1.5 rounded-full ${theme.dot}`} aria-hidden />
              {column.title}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{column.cards.length}</span>
          </div>
          <button
            onClick={handleDelete}
            className="size-6 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-accent cursor-pointer transition-colors"
            title="Delete column"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div
          ref={setNodeRef}
          className={`flex-1 overflow-y-auto min-h-[40px] rounded-lg p-1 space-y-2 transition-colors ${
            isOver ? 'bg-accent/60' : ''
          }`}
        >
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {column.cards.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No cards yet</p>
            ) : (
              column.cards.map((card) => (
                <CardItem key={card.id} card={card} identifier={identifierMap.get(card.id)} />
              ))
            )}
          </SortableContext>
        </div>

        <AddCard columnId={column.id} />
      </div>

      {showModal && <ColumnModal column={column} onClose={() => setShowModal(false)} />}
    </>
  )
}
