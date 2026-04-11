import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/db-init'
import * as queries from '@/lib/queries'
import { broadcast } from '@/lib/ws-broadcast'
import { Events } from '@/lib/types'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb()
  const { id: boardId } = await params
  const { column_ids } = await req.json()
  const result = await queries.reorderColumns(boardId, column_ids)
  broadcast({ event: Events.COLUMNS_REORDERED, data: { board_id: boardId, columns: result } })
  return NextResponse.json(result)
}
