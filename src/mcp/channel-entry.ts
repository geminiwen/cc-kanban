import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { ensureDb } from '../lib/db-init'
import * as queries from '../lib/queries'
import { broadcast } from '../lib/ws-broadcast'
import { Events } from '../lib/types'

export function createMcpServer(): Server {
  const mcp = new Server(
    { name: 'kanban', version: '1.0.0' },
    {
      capabilities: {
        tools: {},
        experimental: {
          'claude/channel': {},
        },
      },
    }
  )

  mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      { name: 'list_boards', description: 'List all kanban boards', inputSchema: { type: 'object' as const, properties: {} } },
      { name: 'get_board', description: 'Get a board with all its columns and cards', inputSchema: { type: 'object' as const, properties: { board_id: { type: 'string', description: 'Board UUID' } }, required: ['board_id'] } },
      { name: 'create_board', description: 'Create a new kanban board', inputSchema: { type: 'object' as const, properties: { title: { type: 'string' }, description: { type: 'string' } }, required: ['title'] } },
      { name: 'create_column', description: 'Add a column to a board', inputSchema: { type: 'object' as const, properties: { board_id: { type: 'string' }, title: { type: 'string' } }, required: ['board_id', 'title'] } },
      { name: 'update_column', description: 'Update a column title and/or description', inputSchema: { type: 'object' as const, properties: { column_id: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' } }, required: ['column_id'] } },
      { name: 'delete_column', description: 'Delete a column and all its cards', inputSchema: { type: 'object' as const, properties: { column_id: { type: 'string' } }, required: ['column_id'] } },
      { name: 'create_card', description: 'Create a new card in a column', inputSchema: { type: 'object' as const, properties: { column_id: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, labels: { type: 'array', items: { type: 'string' } }, due_date: { type: 'string' } }, required: ['column_id', 'title'] } },
      { name: 'update_card', description: 'Update card fields', inputSchema: { type: 'object' as const, properties: { card_id: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, labels: { type: 'array', items: { type: 'string' } }, due_date: { type: 'string' } }, required: ['card_id'] } },
      { name: 'move_card', description: 'Move a card to a different column and/or position', inputSchema: { type: 'object' as const, properties: { card_id: { type: 'string' }, target_column_id: { type: 'string' }, position: { type: 'number' } }, required: ['card_id', 'target_column_id', 'position'] } },
      { name: 'delete_card', description: 'Delete a card', inputSchema: { type: 'object' as const, properties: { card_id: { type: 'string' } }, required: ['card_id'] } },
      { name: 'get_board_summary', description: 'Get a text summary of a board state', inputSchema: { type: 'object' as const, properties: { board_id: { type: 'string' } }, required: ['board_id'] } },
    ],
  }))

  mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
    await ensureDb()
    const { name, arguments: args } = req.params
    const a = (args ?? {}) as Record<string, unknown>

    try {
      switch (name) {
        case 'list_boards': return ok(await queries.listBoards())
        case 'get_board': {
          const board = await queries.getBoard(a.board_id as string)
          return board ? ok(board) : err('Board not found')
        }
        case 'create_board': {
          const board = await queries.createBoard(a.title as string, a.description as string | undefined)
          broadcast({ event: Events.BOARD_CREATED, data: board })
          return ok(board)
        }
        case 'create_column': {
          const col = await queries.createColumn(a.board_id as string, a.title as string)
          broadcast({ event: Events.COLUMN_CREATED, data: col })
          return ok(col)
        }
        case 'update_column': {
          const col = await queries.updateColumn(a.column_id as string, { title: a.title as string | undefined, description: a.description as string | undefined })
          broadcast({ event: Events.COLUMN_RENAMED, data: col })
          return ok(col)
        }
        case 'delete_column': {
          await queries.deleteColumn(a.column_id as string)
          broadcast({ event: Events.COLUMN_DELETED, data: { id: a.column_id } })
          return ok('Column deleted')
        }
        case 'create_card': {
          const card = await queries.createCard({ column_id: a.column_id as string, title: a.title as string, description: a.description as string | undefined, labels: a.labels as string[] | undefined, due_date: a.due_date as string | undefined })
          broadcast({ event: Events.CARD_CREATED, data: card })
          return ok(card)
        }
        case 'update_card': {
          const card = await queries.updateCard(a.card_id as string, { title: a.title as string | undefined, description: a.description as string | undefined, labels: a.labels as string[] | undefined, due_date: a.due_date as string | undefined })
          broadcast({ event: Events.CARD_UPDATED, data: card })
          return ok(card)
        }
        case 'move_card': {
          const card = await queries.moveCard({ card_id: a.card_id as string, target_column_id: a.target_column_id as string, position: a.position as number })
          broadcast({ event: Events.CARD_MOVED, data: card })
          return ok(card)
        }
        case 'delete_card': {
          await queries.deleteCard(a.card_id as string)
          broadcast({ event: Events.CARD_DELETED, data: { id: a.card_id } })
          return ok('Card deleted')
        }
        case 'get_board_summary': {
          const board = await queries.getBoard(a.board_id as string)
          if (!board) return err('Board not found')
          let s = `# ${board.title}\n${board.description ? board.description + '\n' : ''}\n`
          for (const col of board.columns) {
            s += `## ${col.title} (${col.cards.length} cards)\n`
            for (const card of col.cards) {
              const lbl = card.labels?.length ? ` [${card.labels.join(', ')}]` : ''
              const due = card.due_date ? ` (due: ${new Date(card.due_date).toLocaleDateString()})` : ''
              s += `- ${card.title}${lbl}${due}\n`
            }
            s += '\n'
          }
          return ok(s)
        }
        default: return err(`Unknown tool: ${name}`)
      }
    } catch (e: any) {
      return err(e.message)
    }
  })

  return mcp
}

function ok(data: unknown) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  return { content: [{ type: 'text' as const, text }] }
}

function err(msg: string) {
  return { content: [{ type: 'text' as const, text: msg }], isError: true }
}
