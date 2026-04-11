import type { Server } from '@modelcontextprotocol/sdk/server/index.js'
import type { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type { AppContext } from '../../server'

function getCtx(): AppContext {
  return (globalThis as any).__appCtx
}

export function registerSession(id: string, transport: WebStandardStreamableHTTPServerTransport, server: Server) {
  getCtx().registerMcpSession(id, transport, server)
}

export function unregisterSession(id: string) {
  getCtx().unregisterMcpSession(id)
}

export function getTransport(id: string): WebStandardStreamableHTTPServerTransport | undefined {
  return getCtx().mcpTransports.get(id)
}

export function hasTransport(id: string): boolean {
  return getCtx().mcpTransports.has(id)
}
