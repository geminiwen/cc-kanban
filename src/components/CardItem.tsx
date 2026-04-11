'use client'

import { useState, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '@/lib/types'
import { CardModal } from './CardModal'
import { updateCardAction } from '@/lib/actions'

interface CardItemProps {
  card: Card
}

const LABEL_COLORS: Record<string, string> = {
  bug: 'bg-red-200 text-red-800',
  feature: 'bg-blue-200 text-blue-800',
  urgent: 'bg-orange-200 text-orange-800',
  done: 'bg-green-200 text-green-800',
}

export function CardItem({ card }: CardItemProps) {
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleRename = async () => {
    const trimmed = title.trim()
    if (trimmed && trimmed !== card.title) {
      await updateCardAction(card.id, { title: trimmed })
    } else {
      setTitle(card.title)
    }
    setIsEditing(false)
  }

  const handleClick = () => {
    if (isEditing) return
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      // Double click → edit
      setIsEditing(true)
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null
        // Single click → modal
        setShowModal(true)
      }, 250)
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow ${
          isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''
        }`}
      >
        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.map((label) => (
              <span key={label} className={`text-xs px-2 py-0.5 rounded-full ${LABEL_COLORS[label.toLowerCase()] ?? 'bg-gray-200 text-gray-700'}`}>
                {label}
              </span>
            ))}
          </div>
        )}
        {isEditing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') { setTitle(card.title); setIsEditing(false) }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm bg-white border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        ) : (
          <p className="text-sm text-gray-800">{card.title}</p>
        )}
        {card.due_date && (
          <p className="text-xs text-gray-500 mt-1">Due: {new Date(card.due_date).toLocaleDateString()}</p>
        )}
      </div>
      {showModal && <CardModal card={card} onClose={() => setShowModal(false)} />}
    </>
  )
}
