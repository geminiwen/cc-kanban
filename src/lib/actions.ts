'use server'

import { ensureDb } from './db-init'
import * as queries from './queries'
import { broadcast } from './ws-broadcast'
import { Events } from './types'
import type { Board, Column, Card, BoardWithColumns } from './types'

// --- Boards ---
export async function listBoardsAction(): Promise<Board[]> {
  await ensureDb()
  return queries.listBoards()
}

export async function getBoardAction(id: string): Promise<BoardWithColumns | null> {
  await ensureDb()
  return queries.getBoard(id)
}

export async function createBoardAction(title: string, description?: string): Promise<Board> {
  await ensureDb()
  const board = await queries.createBoard(title, description)
  broadcast({ event: Events.BOARD_CREATED, data: board })
  return board
}

// --- Columns ---
export async function createColumnAction(boardId: string, title: string): Promise<Column> {
  await ensureDb()
  const col = await queries.createColumn(boardId, title)
  broadcast({ event: Events.COLUMN_CREATED, data: col })
  return col
}

export async function updateColumnAction(id: string, input: { title?: string; description?: string }): Promise<Column> {
  await ensureDb()
  const col = await queries.updateColumn(id, input)
  broadcast({ event: Events.COLUMN_RENAMED, data: col })
  return col
}

export async function deleteColumnAction(id: string): Promise<void> {
  await ensureDb()
  await queries.deleteColumn(id)
  broadcast({ event: Events.COLUMN_DELETED, data: { id } })
}

export async function reorderColumnsAction(boardId: string, columnIds: string[]): Promise<Column[]> {
  await ensureDb()
  const result = await queries.reorderColumns(boardId, columnIds)
  broadcast({ event: Events.COLUMNS_REORDERED, data: { board_id: boardId, columns: result } })
  return result
}

// --- Cards ---
export async function createCardAction(columnId: string, data: {
  title: string; description?: string; labels?: string[]; due_date?: string
}): Promise<Card> {
  await ensureDb()
  const card = await queries.createCard({ column_id: columnId, ...data })
  broadcast({ event: Events.CARD_CREATED, data: card })
  return card
}

export async function updateCardAction(id: string, data: {
  title?: string; description?: string; labels?: string[]; due_date?: string | null
}): Promise<Card> {
  await ensureDb()
  const card = await queries.updateCard(id, data)
  broadcast({ event: Events.CARD_UPDATED, data: card })
  return card
}

export async function moveCardAction(cardId: string, targetColumnId: string, position: number): Promise<Card> {
  await ensureDb()
  const card = await queries.moveCard({ card_id: cardId, target_column_id: targetColumnId, position })
  broadcast({ event: Events.CARD_MOVED, data: card })
  return card
}

export async function deleteCardAction(id: string): Promise<void> {
  await ensureDb()
  await queries.deleteCard(id)
  broadcast({ event: Events.CARD_DELETED, data: { id } })
}
