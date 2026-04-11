'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ColumnWithCards } from '@/lib/types'
import { CardItem } from './CardItem'
import { AddCard } from './AddCard'
import { renameColumnAction, deleteColumnAction } from '@/lib/actions'

interface ColumnProps {
  column: ColumnWithCards
}

export function Column({ column }: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(column.title)

  const { setNodeRef, isOver } = useDroppable({
    id: `column:${column.id}`,
    data: { type: 'column', columnId: column.id },
  })

  const handleRename = async () => {
    const trimmed = title.trim()
    if (trimmed && trimmed !== column.title) {
      await renameColumnAction(column.id, trimmed)
    } else {
      setTitle(column.title)
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await deleteColumnAction(column.id)
  }

  const cardIds = column.cards.map((c) => c.id)

  return (
    <div className="flex-shrink-0 w-72 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex flex-col max-h-full">
      <div className="flex items-center justify-between mb-3">
        {isEditing ? (
          <input
            autoFocus value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') { setTitle(column.title); setIsEditing(false) }
            }}
            className="text-sm font-semibold bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded px-2 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        ) : (
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer" onDoubleClick={() => setIsEditing(true)}>
            {column.title}
            <span className="ml-2 text-gray-400 dark:text-gray-500 font-normal">{column.cards.length}</span>
          </h3>
        )}
        <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 text-sm ml-2 cursor-pointer" title="Delete column">&times;</button>
      </div>

      <div ref={setNodeRef} className={`flex-1 overflow-y-auto min-h-[40px] rounded transition-colors ${isOver ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => <CardItem key={card.id} card={card} />)}
        </SortableContext>
      </div>

      <AddCard columnId={column.id} />
    </div>
  )
}
