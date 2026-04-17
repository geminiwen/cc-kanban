'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { Column } from '@/lib/types'
import { updateColumnAction } from '@/lib/actions'

interface ColumnModalProps {
  column: Column
  onClose: () => void
}

export function ColumnModal({ column, onClose }: ColumnModalProps) {
  const [title, setTitle] = useState(column.title)
  const [description, setDescription] = useState(column.description ?? '')

  const handleSave = async () => {
    await updateColumnAction(column.id, {
      title: title.trim() || column.title,
      description: description.trim() || undefined,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-popover text-popover-foreground rounded-xl shadow-2xl shadow-black/20 border border-border w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Edit Column</h2>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              autoFocus
              className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe this column..."
              className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
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
  )
}
