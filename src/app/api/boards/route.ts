import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/db-init'
import * as queries from '@/lib/queries'
import { broadcast } from '@/lib/ws-broadcast'
import { Events } from '@/lib/types'

export async function GET() {
  await ensureDb()
  return NextResponse.json(await queries.listBoards())
}

export async function POST(req: Request) {
  await ensureDb()
  const { title, description } = await req.json()
  const board = await queries.createBoard(title, description)
  broadcast({ event: Events.BOARD_CREATED, data: board })
  return NextResponse.json(board, { status: 201 })
}
