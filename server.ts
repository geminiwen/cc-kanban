import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { createServer } from 'http'
import next from 'next'
import { parse } from 'url'
import { WebSocketServer, WebSocket } from 'ws'
import type { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js'
import type { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

export interface AppContext {
  wss: WebSocketServer
  mcpTransports: Map<string, WebStandardStreamableHTTPServerTransport>
  mcpServers: Map<string, McpServer>
  broadcast: (message: { event: string; data: unknown }) => void
  notifyChannels: (event: string, data: unknown) => Promise<void>
  registerMcpSession: (id: string, transport: WebStandardStreamableHTTPServerTransport, server: McpServer) => void
  unregisterMcpSession: (id: string) => void
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME ?? '0.0.0.0'
const port = parseInt(process.env.PORT ?? '3000', 10)
const wsPort = parseInt(process.env.WS_PORT ?? '3001', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // In dev (Turbopack HMR on main server), isolate business WS on its own port.
  // In prod (no HMR), attach WS to the main server for single-port deployment.
  let wss: WebSocketServer
  let wsServer: ReturnType<typeof createServer> | null = null
  if (dev) {
    wsServer = createServer()
    wss = new WebSocketServer({ server: wsServer, path: '/ws' })
    const nextUpgradeHandler = app.getUpgradeHandler()
    server.on('upgrade', (req, socket, head) => {
      nextUpgradeHandler(req, socket, head)
    })
  } else {
    wss = new WebSocketServer({ server, path: '/ws' })
  }
  wss.on('connection', () => {
    console.log(`[ws] client connected (${wss.clients.size} total)`)
  })

  // MCP session storage
  const mcpTransports = new Map<string, WebStandardStreamableHTTPServerTransport>()
  const mcpServers = new Map<string, McpServer>()

  // Broadcast to WebSocket clients
  function broadcast(message: { event: string; data: unknown }) {
    const payload = JSON.stringify(message)
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
      }
    }
    notifyChannels(message.event, message.data)
  }

  // Push channel notifications to all MCP sessions
  async function notifyChannels(event: string, data: unknown) {
    const deadSessions: string[] = []
    for (const [id, mcpServer] of mcpServers) {
      try {
        await mcpServer.notification({
          method: 'notifications/claude/channel',
          params: {
            content: JSON.stringify(data),
            meta: { event },
          },
        })
      } catch {
        deadSessions.push(id)
      }
    }
    for (const id of deadSessions) {
      mcpServers.delete(id)
      mcpTransports.delete(id)
    }
  }

  function registerMcpSession(id: string, transport: WebStandardStreamableHTTPServerTransport, mcpServer: McpServer) {
    mcpTransports.set(id, transport)
    mcpServers.set(id, mcpServer)
    console.log(`[mcp] session registered: ${id} (total: ${mcpServers.size})`)
  }

  function unregisterMcpSession(id: string) {
    mcpTransports.delete(id)
    mcpServers.delete(id)
    console.log(`[mcp] session unregistered: ${id}`)
  }

  // MCP heartbeat — ping all sessions every 30s to keep connections alive
  setInterval(() => {
    for (const [id, mcpServer] of mcpServers) {
      mcpServer.notification({
        method: 'notifications/ping',
        params: {},
      }).catch(() => {
        mcpServers.delete(id)
        mcpTransports.delete(id)
        console.log(`[mcp] session ${id} dead, removed`)
      })
    }
  }, 30_000)

  // Expose context to Next.js
  const ctx: AppContext = {
    wss,
    mcpTransports,
    mcpServers,
    broadcast,
    notifyChannels,
    registerMcpSession,
    unregisterMcpSession,
  }
  ;(globalThis as any).__appCtx = ctx

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    if (!wsServer) console.log(`[ws] WebSocket on ws://${hostname}:${port}/ws`)
  })
  wsServer?.listen(wsPort, hostname, () => {
    console.log(`[ws] WebSocket on ws://${hostname}:${wsPort}/ws`)
  })
})
