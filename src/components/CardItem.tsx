'use client'

import { useState, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '@/lib/types'
import { CardModal } from './CardModal'
import { updateCardAction } from '@/lib/actions'

interface CardItemProps {
  card: Card
  identifier?: string
}

const LABEL_COLORS: Record<string, string> = {
  bug: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
  feature: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  urgent: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300',
}

export function CardItem({ card, identifier }: CardItemProps) {
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
    opacity: isDragging ? 0.3 : 1,
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
      setIsEditing(true)
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null
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
        className="group rounded-lg border-[0.5px] border-border bg-card py-3 px-2.5 cursor-pointer shadow-[0_3px_6px_-2px_rgba(0,0,0,0.02),0_1px_1px_0_rgba(0,0,0,0.04)] transition-shadow hover:shadow-sm"
      >
        {identifier && (
          <p className="text-[11px] text-muted-foreground font-mono tabular-nums mb-0.5">{identifier}</p>
        )}
        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 mb-1">
            {card.labels.map((label) => (
              <span
                key={label}
                className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                  LABEL_COLORS[label.toLowerCase()] ?? 'bg-muted text-muted-foreground'
                }`}
              >
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
              if (e.key === 'Escape') {
                setTitle(card.title)
                setIsEditing(false)
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm bg-background border border-input text-foreground rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <p className="text-sm font-medium leading-snug text-foreground line-clamp-2">{card.title}</p>
        )}
        {card.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{card.description}</p>
        )}
        {card.due_date && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Due: {new Date(card.due_date).toLocaleDateString()}
          </p>
        )}
      </div>
      {showModal && <CardModal card={card} onClose={() => setShowModal(false)} />}
    </>
  )
}
