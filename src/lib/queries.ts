import pool from './db'
import type { Board, BoardWithColumns, Column, ColumnWithCards, Card } from './types'

// --- Boards ---
export async function listBoards(): Promise<Board[]> {
  const { rows } = await pool.query<Board>('SELECT * FROM boards ORDER BY created_at DESC')
  return rows
}

export async function getBoard(id: string): Promise<BoardWithColumns | null> {
  const { rows: boards } = await pool.query<Board>('SELECT * FROM boards WHERE id = $1', [id])
  if (boards.length === 0) return null

  const { rows: columns } = await pool.query(
    `SELECT c.*, COALESCE(json_agg(
      json_build_object(
        'id', ca.id, 'column_id', ca.column_id, 'title', ca.title,
        'description', ca.description, 'position', ca.position,
        'labels', ca.labels, 'due_date', ca.due_date,
        'created_at', ca.created_at, 'updated_at', ca.updated_at
      ) ORDER BY ca.position
    ) FILTER (WHERE ca.id IS NOT NULL), '[]') AS cards
    FROM columns c
    LEFT JOIN cards ca ON ca.column_id = c.id
    WHERE c.board_id = $1
    GROUP BY c.id
    ORDER BY c.position`,
    [id]
  )

  return { ...boards[0], columns: columns as ColumnWithCards[] }
}

export async function createBoard(title: string, description?: string): Promise<Board> {
  const { rows } = await pool.query<Board>(
    'INSERT INTO boards (title, description) VALUES ($1, $2) RETURNING *',
    [title, description ?? null]
  )
  return rows[0]
}

// --- Columns ---
export async function createColumn(boardId: string, title: string): Promise<Column> {
  const { rows: maxPos } = await pool.query<{ max: number | null }>(
    'SELECT MAX(position) as max FROM columns WHERE board_id = $1', [boardId]
  )
  const position = (maxPos[0].max ?? -1) + 1
  const { rows } = await pool.query<Column>(
    'INSERT INTO columns (board_id, title, position) VALUES ($1, $2, $3) RETURNING *',
    [boardId, title, position]
  )
  return rows[0]
}

export async function renameColumn(id: string, title: string): Promise<Column> {
  const { rows } = await pool.query<Column>(
    'UPDATE columns SET title = $2 WHERE id = $1 RETURNING *', [id, title]
  )
  if (rows.length === 0) throw new Error(`Column ${id} not found`)
  return rows[0]
}

export async function deleteColumn(id: string): Promise<void> {
  const { rowCount } = await pool.query('DELETE FROM columns WHERE id = $1', [id])
  if (rowCount === 0) throw new Error(`Column ${id} not found`)
}

export async function reorderColumns(boardId: string, columnIds: string[]): Promise<Column[]> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (let i = 0; i < columnIds.length; i++) {
      await client.query(
        'UPDATE columns SET position = $1 WHERE id = $2 AND board_id = $3',
        [i, columnIds[i], boardId]
      )
    }
    await client.query('COMMIT')
    const { rows } = await client.query<Column>(
      'SELECT * FROM columns WHERE board_id = $1 ORDER BY position', [boardId]
    )
    return rows
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

// --- Cards ---
export async function createCard(input: {
  column_id: string; title: string; description?: string; labels?: string[]; due_date?: string
}): Promise<Card> {
  const { rows: maxPos } = await pool.query<{ max: number | null }>(
    'SELECT MAX(position) as max FROM cards WHERE column_id = $1', [input.column_id]
  )
  const position = (maxPos[0].max ?? -1) + 1
  const { rows } = await pool.query<Card>(
    `INSERT INTO cards (column_id, title, description, position, labels, due_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [input.column_id, input.title, input.description ?? null, position, input.labels ?? [], input.due_date ?? null]
  )
  return rows[0]
}

export async function updateCard(id: string, input: {
  title?: string; description?: string; labels?: string[]; due_date?: string | null
}): Promise<Card> {
  const sets: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (input.title !== undefined) { sets.push(`title = $${idx++}`); values.push(input.title) }
  if (input.description !== undefined) { sets.push(`description = $${idx++}`); values.push(input.description) }
  if (input.labels !== undefined) { sets.push(`labels = $${idx++}`); values.push(input.labels) }
  if (input.due_date !== undefined) { sets.push(`due_date = $${idx++}`); values.push(input.due_date) }

  if (sets.length === 0) {
    const { rows } = await pool.query<Card>('SELECT * FROM cards WHERE id = $1', [id])
    if (rows.length === 0) throw new Error(`Card ${id} not found`)
    return rows[0]
  }

  values.push(id)
  const { rows } = await pool.query<Card>(
    `UPDATE cards SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values
  )
  if (rows.length === 0) throw new Error(`Card ${id} not found`)
  return rows[0]
}

export async function moveCard(input: {
  card_id: string; target_column_id: string; position: number
}): Promise<Card> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      'UPDATE cards SET position = position + 1 WHERE column_id = $1 AND position >= $2',
      [input.target_column_id, input.position]
    )
    const { rows } = await client.query<Card>(
      'UPDATE cards SET column_id = $1, position = $2 WHERE id = $3 RETURNING *',
      [input.target_column_id, input.position, input.card_id]
    )
    await client.query('COMMIT')
    if (rows.length === 0) throw new Error(`Card ${input.card_id} not found`)
    return rows[0]
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function deleteCard(id: string): Promise<void> {
  const { rowCount } = await pool.query('DELETE FROM cards WHERE id = $1', [id])
  if (rowCount === 0) throw new Error(`Card ${id} not found`)
}
