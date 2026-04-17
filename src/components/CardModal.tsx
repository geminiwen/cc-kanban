'use client'

import { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import type { Card } from '@/lib/types'
import { updateCardAction, deleteCardAction } from '@/lib/actions'

interface CardModalProps {
  card: Card
  onClose: () => void
}

export function CardModal({ card, onClose }: CardModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [labelsStr, setLabelsStr] = useState(card.labels.join(', '))

  const handleSave = async () => {
    const labels = labelsStr.split(',').map((s) => s.trim()).filter(Boolean)
    await updateCardAction(card.id, { title, description: description || undefined, labels })
    onClose()
  }

  const handleDelete = async () => {
    await deleteCardAction(card.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-popover text-popover-foreground rounded-xl shadow-2xl shadow-black/20 border border-border w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Edit Card</h2>
          <button
            onClick={onClose}
            className="size-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Labels (comma-separated)</label>
            <input
              value={labelsStr}
              onChange={(e) => setLabelsStr(e.target.value)}
              placeholder="bug, feature, urgent"
              className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex justify-between mt-6">
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 text-destructive hover:opacity-80 text-sm cursor-pointer transition-opacity"
          >
            <Trash2 className="size-3.5" />
            Delete card
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-primary text-primary-foreground text-sm px-4 py-1.5 rounded-md hover:opacity-90 cursor-pointer transition-opacity"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
