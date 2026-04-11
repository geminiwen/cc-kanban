import { WebSocketServer, WebSocket } from 'ws'
import { notifyAllSessions } from './mcp-sessions'

const g = globalThis as unknown as { __wss?: WebSocketServer }

function getWss(): WebSocketServer {
  if (!g.__wss) {
    const port = parseInt(process.env.WS_PORT ?? '3001', 10)
    g.__wss = new WebSocketServer({ port, host: '127.0.0.1' })
    console.log(`[ws] WebSocket server listening on ws://localhost:${port}`)
  }
  return g.__wss
}

export function broadcast(message: { event: string; data: unknown }) {
  const server = getWss()
  const payload = JSON.stringify(message)
  for (const client of server.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  }
  notifyAllSessions(message.event, message.data).catch(() => {})
}
