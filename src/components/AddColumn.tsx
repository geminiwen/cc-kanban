'use client'

import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { createColumnAction } from '@/lib/actions'

interface AddColumnProps {
  boardId: string
}

export function AddColumn({ boardId }: AddColumnProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      await createColumnAction(boardId, trimmed)
      setTitle('')
      inputRef.current?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDone = () => {
    setIsOpen(false)
    setTitle('')
  }

  if (!isOpen) {
    return (
      <div className="flex-shrink-0 w-[280px]">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full inline-flex items-center gap-1.5 rounded-xl p-3 text-sm text-muted-foreground hover:text-foreground border-2 border-dashed border-border hover:border-muted-foreground/50 hover:bg-muted/40 cursor-pointer transition-colors"
        >
          <Plus className="size-4" />
          Add column
        </button>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 w-[280px] bg-muted/50 rounded-xl p-2">
      <input
        ref={inputRef}
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') handleDone()
        }}
        placeholder="Column title..."
        className="w-full border border-input bg-background text-foreground rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleSubmit}
          disabled={submitting || !title.trim()}
          className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-md hover:opacity-90 cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
        <button
          onClick={handleDone}
          className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}
