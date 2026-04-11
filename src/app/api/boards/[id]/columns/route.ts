import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/db-init'
import * as queries from '@/lib/queries'
import { broadcast } from '@/lib/ws-broadcast'
import { Events } from '@/lib/types'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb()
  const { id: boardId } = await params
  const { title } = await req.json()
  const col = await queries.createColumn(boardId, title)
  broadcast({ event: Events.COLUMN_CREATED, data: col })
  return NextResponse.json(col, { status: 201 })
}
