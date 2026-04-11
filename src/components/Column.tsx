'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ColumnWithCards } from '@/lib/types'
import { CardItem } from './CardItem'
import { AddCard } from './AddCard'
import { ColumnModal } from './ColumnModal'
import { deleteColumnAction } from '@/lib/actions'

interface ColumnProps {
  column: ColumnWithCards
}

export function Column({ column }: ColumnProps) {
  const [showModal, setShowModal] = useState(false)

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
      <div className="flex-shrink-0 w-72 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex flex-col max-h-full">
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer"
            onDoubleClick={() => setShowModal(true)}
          >
            {column.title}
            <span className="ml-2 text-gray-400 dark:text-gray-500 font-normal">{column.cards.length}</span>
          </h3>
          <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 text-sm ml-2 cursor-pointer" title="Delete column">&times;</button>
        </div>

        <div ref={setNodeRef} className={`flex-1 overflow-y-auto min-h-[40px] rounded transition-colors ${isOver ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {column.cards.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">No cards yet</p>
            ) : (
              column.cards.map((card) => <CardItem key={card.id} card={card} />)
            )}
          </SortableContext>
        </div>

        <AddCard columnId={column.id} />
      </div>

      {showModal && <ColumnModal column={column} onClose={() => setShowModal(false)} />}
    </>
  )
}
