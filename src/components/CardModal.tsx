'use client'

import { useState } from 'react'
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold">Edit Card</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">&times;</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Labels (comma-separated)</label>
            <input value={labelsStr} onChange={(e) => setLabelsStr(e.target.value)} placeholder="bug, feature, urgent"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <div className="flex justify-between mt-6">
          <button onClick={handleDelete} className="text-red-500 hover:text-red-700 text-sm cursor-pointer">Delete card</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 cursor-pointer">Cancel</button>
            <button onClick={handleSave} className="bg-blue-500 text-white text-sm px-4 py-1 rounded hover:bg-blue-600 cursor-pointer">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
