'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { WsMessage } from '@/lib/types'

export function useWebSocket(onMessage: (msg: WsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsPort = process.env.NEXT_PUBLIC_WS_PORT
    const host = wsPort ? `${window.location.hostname}:${wsPort}` : window.location.host
    const url = `${protocol}//${host}/ws`

    let ws: WebSocket
    try {
      ws = new WebSocket(url)
    } catch {
      return
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsMessage
        onMessageRef.current(msg)
      } catch { /* ignore */ }
    }

    ws.onclose = () => {
      setTimeout(() => { if (wsRef.current === ws) connect() }, 2000)
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [])

  useEffect(() => {
    connect()
    return () => { const ws = wsRef.current; wsRef.current = null; ws?.close() }
  }, [connect])
}
