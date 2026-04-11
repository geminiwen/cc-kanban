import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/db-init'
import * as queries from '@/lib/queries'
import { broadcast } from '@/lib/ws-broadcast'
import { Events } from '@/lib/types'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb()
  const { id } = await params
  const { title } = await req.json()
  const col = await queries.renameColumn(id, title)
  broadcast({ event: Events.COLUMN_RENAMED, data: col })
  return NextResponse.json(col)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb()
  const { id } = await params
  await queries.deleteColumn(id)
  broadcast({ event: Events.COLUMN_DELETED, data: { id } })
  return NextResponse.json({ ok: true })
}
