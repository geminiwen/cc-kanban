import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createMcpServer } from '@/mcp/channel-entry'
import { registerSession, unregisterSession, getTransport, hasTransport } from '@/lib/mcp-sessions'

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
          registerSession(id, transport, server)
        },
        onsessionclosed: (id) => {
          unregisterSession(id)
        },
      })

      await server.connect(transport)

      return transport.handleRequest(req, { parsedBody: body })
    }

    if (!sessionId || !hasTransport(sessionId)) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return getTransport(sessionId)!.handleRequest(req, { parsedBody: body })
  }

  if (req.method === 'GET') {
    if (!sessionId || !hasTransport(sessionId)) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return getTransport(sessionId)!.handleRequest(req)
  }

  if (req.method === 'DELETE') {
    if (!sessionId || !hasTransport(sessionId)) {
      return new Response(null, { status: 204 })
    }
    return getTransport(sessionId)!.handleRequest(req)
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
