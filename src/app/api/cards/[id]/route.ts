import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/db-init'
import * as queries from '@/lib/queries'
import { broadcast } from '@/lib/ws-broadcast'
import { Events } from '@/lib/types'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb()
  const { id } = await params
  const body = await req.json()
  const card = await queries.updateCard(id, body)
  broadcast({ event: Events.CARD_UPDATED, data: card })
  return NextResponse.json(card)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb()
  const { id } = await params
  await queries.deleteCard(id)
  broadcast({ event: Events.CARD_DELETED, data: { id } })
  return NextResponse.json({ ok: true })
}
