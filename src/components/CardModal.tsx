'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, X } from 'lucide-react'
import type { Attachment, Card } from '@/lib/types'
import { updateCardAction, deleteCardAction } from '@/lib/actions'

interface CardModalProps {
  card: Card
  onClose: () => void
}

const MAX_MB = 5

export function CardModal({ card, onClose }: CardModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [labelsStr, setLabelsStr] = useState(card.labels.join(', '))
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Attachment | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachments = card.attachments ?? []

  const handleSave = async () => {
    const labels = labelsStr.split(',').map((s) => s.trim()).filter(Boolean)
    await updateCardAction(card.id, { title, description: description || undefined, labels })
    onClose()
  }

  const handleDelete = async () => {
    await deleteCardAction(card.id)
    onClose()
  }

  const uploadFiles = async (files: FileList | File[]) => {
    setError(null)
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image`)
        continue
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`${file.name} exceeds ${MAX_MB}MB`)
        continue
      }
      setUploading((n) => n + 1)
      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch(`/api/cards/${card.id}/attachments`, { method: 'POST', body: form })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }))
          setError(err.error ?? 'Upload failed')
        }
      } finally {
        setUploading((n) => n - 1)
      }
    }
  }

  const handleDeleteAttachment = async (id: string) => {
    await fetch(`/api/attachments/${id}`, { method: 'DELETE' })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files)
  }

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (const item of items) {
        if (item.kind === 'file') {
          const f = item.getAsFile()
          if (f) files.push(f)
        }
      }
      if (files.length > 0) {
        e.preventDefault()
        uploadFiles(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id])

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-popover text-popover-foreground rounded-xl shadow-2xl shadow-black/20 border w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto transition-colors ${
          dragActive ? 'border-brand' : 'border-border'
        }`}
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragActive(false)
        }}
        onDrop={handleDrop}
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
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">
                Attachments {attachments.length > 0 && <span className="text-muted-foreground font-normal">({attachments.length})</span>}
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <ImagePlus className="size-3.5" />
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files) uploadFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </div>
            {attachments.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {attachments.map((a) => (
                  <div key={a.id} className="group relative rounded-md overflow-hidden border border-border bg-muted/50 aspect-square">
                    <button
                      type="button"
                      onClick={() => setPreview(a)}
                      className="block w-full h-full cursor-zoom-in"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/uploads/${a.filename}`}
                        alt={a.original_name ?? ''}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(a.id)}
                      className="absolute top-1 right-1 size-6 inline-flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground border border-dashed border-border rounded-md py-3 text-center">
                Drag, paste, or upload images (≤ {MAX_MB}MB each)
              </p>
            )}
            {uploading > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">Uploading {uploading}...</p>
            )}
            {error && (
              <p className="text-xs text-destructive mt-1.5">{error}</p>
            )}
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

      {preview && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-8"
          onClick={() => setPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/uploads/${preview.filename}`}
            alt={preview.original_name ?? ''}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </div>
  )
}
