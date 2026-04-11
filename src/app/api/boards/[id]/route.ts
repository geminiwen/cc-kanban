import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/db-init'
import * as queries from '@/lib/queries'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb()
  const { id } = await params
  const board = await queries.getBoard(id)
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(board)
}
