import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/db-init'
import * as queries from '@/lib/queries'
import { broadcast } from '@/lib/ws-broadcast'
import { Events } from '@/lib/types'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb()
  const { id: columnId } = await params
  const body = await req.json()
  const card = await queries.createCard({ column_id: columnId, ...body })
  broadcast({ event: Events.CARD_CREATED, data: card })
  return NextResponse.json(card, { status: 201 })
}
