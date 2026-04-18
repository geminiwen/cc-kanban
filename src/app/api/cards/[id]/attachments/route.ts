import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/db-init'
import * as queries from '@/lib/queries'
import { broadcast } from '@/lib/ws-broadcast'
import { Events } from '@/lib/types'
import { ALLOWED_MIME, MAX_UPLOAD_BYTES, extForMime, saveUpload } from '@/lib/uploads'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb()
  const { id: cardId } = await params

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 415 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'File exceeds 5MB' }, { status: 413 })
  }

  const filename = `${crypto.randomUUID()}.${extForMime(file.type)}`
  const bytes = new Uint8Array(await file.arrayBuffer())
  await saveUpload(bytes, filename)

  const attachment = await queries.createAttachment({
    card_id: cardId,
    filename,
    original_name: file.name || null,
    mime_type: file.type,
    size: file.size,
  })
  broadcast({ event: Events.ATTACHMENT_CREATED, data: attachment })
  return NextResponse.json(attachment, { status: 201 })
}
