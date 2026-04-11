import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createMcpServer } from '@/mcp/channel-entry'
import { registerSession, unregisterSession } from '@/lib/mcp-sessions'

// Store transports by session ID
const transports = new Map<string, WebStandardStreamableHTTPServerTransport>()

async function handleMcp(req: Request): Promise<Response> {
  const sessionId = req.headers.get('mcp-session-id')

  if (req.method === 'POST') {
    const body = await req.json()

    const isInit = body?.method === 'initialize' ||
      (Array.isArray(body) && body.some((m: any) => m.method === 'initialize'))

    if (isInit) {
      const server = createMcpServer()

      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
          transports.set(id, transport)
          registerSession(id, server)
        },
        onsessionclosed: (id) => {
          transports.delete(id)
          unregisterSession(id)
        },
      })

      await server.connect(transport)

      return transport.handleRequest(req, { parsedBody: body })
    }

    if (!sessionId || !transports.has(sessionId)) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return transports.get(sessionId)!.handleRequest(req, { parsedBody: body })
  }

  if (req.method === 'GET') {
    if (!sessionId || !transports.has(sessionId)) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return transports.get(sessionId)!.handleRequest(req)
  }

  if (req.method === 'DELETE') {
    if (!sessionId || !transports.has(sessionId)) {
      return new Response(null, { status: 204 })
    }
    return transports.get(sessionId)!.handleRequest(req)
  }

  return new Response('Method not allowed', { status: 405 })
}

export async function GET(req: Request) {
  return handleMcp(req)
}

export async function POST(req: Request) {
  return handleMcp(req)
}

export async function DELETE(req: Request) {
  return handleMcp(req)
}
