'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { WsMessage } from '@/lib/types'

export function useWebSocket(onMessage: (msg: WsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:3001`)

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsMessage
        onMessageRef.current(msg)
      } catch { /* ignore */ }
    }

    ws.onclose = () => {
      setTimeout(() => { if (wsRef.current === ws) connect() }, 2000)
    }

    wsRef.current = ws
  }, [])

  useEffect(() => {
    connect()
    return () => { const ws = wsRef.current; wsRef.current = null; ws?.close() }
  }, [connect])
}
