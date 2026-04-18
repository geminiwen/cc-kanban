export interface Board {
  id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Column {
  id: string
  board_id: string
  title: string
  description: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  column_id: string
  title: string
  description: string | null
  position: number
  labels: string[]
  due_date: string | null
  created_at: string
  updated_at: string
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  card_id: string
  filename: string
  original_name: string | null
  mime_type: string
  size: number
  created_at: string
}

export interface BoardWithColumns extends Board {
  columns: ColumnWithCards[]
}

export interface ColumnWithCards extends Column {
  cards: Card[]
}

export interface WsMessage {
  event: string
  data: unknown
}

export const Events = {
  BOARD_CREATED: 'board:created',
  CARD_CREATED: 'card:created',
  CARD_UPDATED: 'card:updated',
  CARD_MOVED: 'card:moved',
  CARD_DELETED: 'card:deleted',
  COLUMN_CREATED: 'column:created',
  COLUMN_RENAMED: 'column:renamed',
  COLUMN_DELETED: 'column:deleted',
  COLUMNS_REORDERED: 'columns:reordered',
  ATTACHMENT_CREATED: 'attachment:created',
  ATTACHMENT_DELETED: 'attachment:deleted',
} as const
