import pool from './db'
import type { Board, BoardWithColumns, Column, ColumnWithCards, Card, Attachment } from './types'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

// --- Boards ---
export async function listBoards(): Promise<Board[]> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM boards ORDER BY created_at DESC')
  return rows as Board[]
}

export async function getBoard(id: string): Promise<BoardWithColumns | null> {
  const [boards] = await pool.query<RowDataPacket[]>('SELECT * FROM boards WHERE id = ?', [id])
  if (boards.length === 0) return null

  const board = boards[0] as Board

  const [columns] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM `columns` WHERE board_id = ? ORDER BY position',
    [id]
  )

  const columnsWithCards: ColumnWithCards[] = []
  const allCardIds: string[] = []
  const cardsByColumn = new Map<string, Card[]>()

  for (const col of columns) {
    const [cards] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM cards WHERE column_id = ? ORDER BY position',
      [col.id]
    )
    const parsedCards = (cards as Card[]).map((c) => ({
      ...c,
      labels: typeof c.labels === 'string' ? JSON.parse(c.labels) : (c.labels ?? []),
    }))
    cardsByColumn.set(col.id, parsedCards)
    for (const c of parsedCards) allCardIds.push(c.id)
  }

  const attachmentsByCard = await getAttachmentsByCardIds(allCardIds)

  for (const col of columns) {
    const cards = cardsByColumn.get(col.id) ?? []
    const withAttachments = cards.map((c) => ({ ...c, attachments: attachmentsByCard.get(c.id) ?? [] }))
    columnsWithCards.push({ ...(col as Column), cards: withAttachments })
  }

  return { ...board, columns: columnsWithCards }
}

export async function createBoard(title: string, description?: string): Promise<Board> {
  const id = crypto.randomUUID()
  await pool.query(
    'INSERT INTO boards (id, title, description) VALUES (?, ?, ?)',
    [id, title, description ?? null]
  )
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM boards WHERE id = ?', [id])
  return rows[0] as Board
}

// --- Columns ---
export async function createColumn(boardId: string, title: string): Promise<Column> {
  const [maxPos] = await pool.query<RowDataPacket[]>(
    'SELECT MAX(position) as max_pos FROM `columns` WHERE board_id = ?', [boardId]
  )
  const position = (maxPos[0].max_pos ?? -1) + 1
  const id = crypto.randomUUID()

  await pool.query(
    'INSERT INTO `columns` (id, board_id, title, position) VALUES (?, ?, ?, ?)',
    [id, boardId, title, position]
  )
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM `columns` WHERE id = ?', [id])
  return rows[0] as Column
}

export async function updateColumn(id: string, input: { title?: string; description?: string }): Promise<Column> {
  const sets: string[] = []
  const values: unknown[] = []
  if (input.title !== undefined) { sets.push('title = ?'); values.push(input.title) }
  if (input.description !== undefined) { sets.push('description = ?'); values.push(input.description) }
  if (sets.length > 0) {
    values.push(id)
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE \`columns\` SET ${sets.join(', ')} WHERE id = ?`, values
    )
    if (result.affectedRows === 0) throw new Error(`Column ${id} not found`)
  }
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM `columns` WHERE id = ?', [id])
  if (rows.length === 0) throw new Error(`Column ${id} not found`)
  return rows[0] as Column
}

export async function deleteColumn(id: string): Promise<void> {
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM `columns` WHERE id = ?', [id])
  if (result.affectedRows === 0) throw new Error(`Column ${id} not found`)
}

export async function reorderColumns(boardId: string, columnIds: string[]): Promise<Column[]> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    for (let i = 0; i < columnIds.length; i++) {
      await conn.query(
        'UPDATE `columns` SET position = ? WHERE id = ? AND board_id = ?',
        [i, columnIds[i], boardId]
      )
    }
    await conn.commit()
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM `columns` WHERE board_id = ? ORDER BY position', [boardId]
    )
    return rows as Column[]
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

// --- Cards ---
export async function createCard(input: {
  column_id: string; title: string; description?: string; labels?: string[]; due_date?: string
}): Promise<Card> {
  const [maxPos] = await pool.query<RowDataPacket[]>(
    'SELECT MAX(position) as max_pos FROM cards WHERE column_id = ?', [input.column_id]
  )
  const position = (maxPos[0].max_pos ?? -1) + 1
  const id = crypto.randomUUID()

  await pool.query(
    'INSERT INTO cards (id, column_id, title, description, position, labels, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, input.column_id, input.title, input.description ?? null, position, JSON.stringify(input.labels ?? []), input.due_date ?? null]
  )
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM cards WHERE id = ?', [id])
  const card = rows[0] as Card
  card.labels = typeof card.labels === 'string' ? JSON.parse(card.labels) : (card.labels ?? [])
  return card
}

export async function updateCard(id: string, input: {
  title?: string; description?: string; labels?: string[]; due_date?: string | null
}): Promise<Card> {
  const sets: string[] = []
  const values: unknown[] = []

  if (input.title !== undefined) { sets.push('title = ?'); values.push(input.title) }
  if (input.description !== undefined) { sets.push('description = ?'); values.push(input.description) }
  if (input.labels !== undefined) { sets.push('labels = ?'); values.push(JSON.stringify(input.labels)) }
  if (input.due_date !== undefined) { sets.push('due_date = ?'); values.push(input.due_date) }

  if (sets.length > 0) {
    values.push(id)
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE cards SET ${sets.join(', ')} WHERE id = ?`, values
    )
    if (result.affectedRows === 0) throw new Error(`Card ${id} not found`)
  }

  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM cards WHERE id = ?', [id])
  if (rows.length === 0) throw new Error(`Card ${id} not found`)
  const card = rows[0] as Card
  card.labels = typeof card.labels === 'string' ? JSON.parse(card.labels) : (card.labels ?? [])
  return card
}

export async function moveCard(input: {
  card_id: string; target_column_id: string; position: number
}): Promise<Card> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    await conn.query(
      'UPDATE cards SET position = position + 1 WHERE column_id = ? AND position >= ?',
      [input.target_column_id, input.position]
    )
    const [result] = await conn.query<ResultSetHeader>(
      'UPDATE cards SET column_id = ?, position = ? WHERE id = ?',
      [input.target_column_id, input.position, input.card_id]
    )
    await conn.commit()
    if (result.affectedRows === 0) throw new Error(`Card ${input.card_id} not found`)

    const [rows] = await conn.query<RowDataPacket[]>('SELECT * FROM cards WHERE id = ?', [input.card_id])
    const card = rows[0] as Card
    card.labels = typeof card.labels === 'string' ? JSON.parse(card.labels) : (card.labels ?? [])
    return card
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

export async function deleteCard(id: string): Promise<void> {
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM cards WHERE id = ?', [id])
  if (result.affectedRows === 0) throw new Error(`Card ${id} not found`)
}

export async function getCard(id: string): Promise<Card | null> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM cards WHERE id = ?', [id])
  if (rows.length === 0) return null
  const card = rows[0] as Card
  card.labels = typeof card.labels === 'string' ? JSON.parse(card.labels) : (card.labels ?? [])
  card.attachments = await listAttachments(id)
  return card
}

// --- Attachments ---
export async function listAttachments(cardId: string): Promise<Attachment[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM card_attachments WHERE card_id = ? ORDER BY created_at',
    [cardId]
  )
  return rows as Attachment[]
}

export async function getAttachmentsByCardIds(cardIds: string[]): Promise<Map<string, Attachment[]>> {
  const map = new Map<string, Attachment[]>()
  if (cardIds.length === 0) return map
  const placeholders = cardIds.map(() => '?').join(',')
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM card_attachments WHERE card_id IN (${placeholders}) ORDER BY created_at`,
    cardIds
  )
  for (const row of rows as Attachment[]) {
    const list = map.get(row.card_id) ?? []
    list.push(row)
    map.set(row.card_id, list)
  }
  return map
}

export async function getAttachment(id: string): Promise<Attachment | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM card_attachments WHERE id = ?',
    [id]
  )
  return (rows[0] as Attachment) ?? null
}

export async function createAttachment(input: {
  card_id: string
  filename: string
  original_name: string | null
  mime_type: string
  size: number
}): Promise<Attachment> {
  const id = crypto.randomUUID()
  await pool.query(
    'INSERT INTO card_attachments (id, card_id, filename, original_name, mime_type, size) VALUES (?, ?, ?, ?, ?, ?)',
    [id, input.card_id, input.filename, input.original_name, input.mime_type, input.size]
  )
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM card_attachments WHERE id = ?',
    [id]
  )
  return rows[0] as Attachment
}

export async function deleteAttachment(id: string): Promise<Attachment | null> {
  const existing = await getAttachment(id)
  if (!existing) return null
  await pool.query<ResultSetHeader>('DELETE FROM card_attachments WHERE id = ?', [id])
  return existing
}
