'use client'

import { useState } from 'react'
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Column</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl cursor-pointer">&times;</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              autoFocus
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Describe this column..."
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1 cursor-pointer">Cancel</button>
          <button onClick={handleSave} className="bg-blue-500 text-white text-sm px-4 py-1 rounded hover:bg-blue-600 cursor-pointer">Save</button>
        </div>
      </div>
    </div>
  )
}
