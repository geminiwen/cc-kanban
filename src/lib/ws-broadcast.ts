import type { AppContext } from '../../server'

function getCtx(): AppContext | undefined {
  return (globalThis as unknown as { __appCtx?: AppContext }).__appCtx
}

export function broadcast(message: { event: string; data: unknown }) {
  getCtx()?.broadcast(message)
}
