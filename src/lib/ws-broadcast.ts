import type { AppContext } from '../../server'

function getCtx(): AppContext {
  return (globalThis as any).__appCtx
}

export function broadcast(message: { event: string; data: unknown }) {
  getCtx().broadcast(message)
}
