import type { Server } from '@modelcontextprotocol/sdk/server/index.js'

const g = globalThis as unknown as { __mcpSessions?: Map<string, Server> }

function getSessions(): Map<string, Server> {
  if (!g.__mcpSessions) {
    g.__mcpSessions = new Map()
  }
  return g.__mcpSessions
}

export function registerSession(id: string, server: Server) {
  getSessions().set(id, server)
}

export function unregisterSession(id: string) {
  getSessions().delete(id)
}

export async function notifyAllSessions(event: string, data: unknown) {
  for (const [, server] of getSessions()) {
    try {
      await server.notification({
        method: 'notifications/claude/channel',
        params: {
          content: JSON.stringify(data),
          meta: { event },
        },
      })
    } catch {
      // session may be closed
    }
  }
}
