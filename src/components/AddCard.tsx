'use client'

import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { createCardAction } from '@/lib/actions'

interface AddCardProps {
  columnId: string
}

export function AddCard({ columnId }: AddCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      await createCardAction(columnId, { title: trimmed, description: description.trim() || undefined })
      setTitle('')
      setDescription('')
      titleRef.current?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    setTitle('')
    setDescription('')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md px-2 py-1.5 mt-1 cursor-pointer transition-colors"
      >
        <Plus className="size-3.5" />
        Add card
      </button>
    )
  }

  return (
    <div className="mt-1 px-1">
      <input
        ref={titleRef}
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') handleCancel()
        }}
        placeholder="Card title..."
        className="w-full border border-input bg-background text-foreground rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') handleCancel()
        }}
        placeholder="Description (optional)"
        className="w-full border border-input bg-background text-foreground rounded-md px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring mt-1"
        rows={2}
      />
      <div className="flex gap-2 mt-1">
        <button
          onClick={handleSubmit}
          disabled={submitting || !title.trim()}
          className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-md hover:opacity-90 cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
        <button
          onClick={handleCancel}
          className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}
