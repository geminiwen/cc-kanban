import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/db-init'
import * as queries from '@/lib/queries'
import { broadcast } from '@/lib/ws-broadcast'
import { Events } from '@/lib/types'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb()
  const { id } = await params
  const { target_column_id, position } = await req.json()
  const card = await queries.moveCard({ card_id: id, target_column_id, position })
  broadcast({ event: Events.CARD_MOVED, data: card })
  return NextResponse.json(card)
}
