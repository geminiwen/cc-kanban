import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/db-init'
import * as queries from '@/lib/queries'
import { broadcast } from '@/lib/ws-broadcast'
import { Events } from '@/lib/types'
import { removeUpload } from '@/lib/uploads'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb()
  const { id } = await params
  const removed = await queries.deleteAttachment(id)
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await removeUpload(removed.filename)
  broadcast({ event: Events.ATTACHMENT_DELETED, data: { id: removed.id, card_id: removed.card_id } })
  return NextResponse.json({ ok: true })
}
