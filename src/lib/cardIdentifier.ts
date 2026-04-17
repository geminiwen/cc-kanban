import type { BoardWithColumns } from './types'

export function deriveBoardPrefix(title: string): string {
  const latin = title.replace(/[^A-Za-z]/g, '')
  if (latin.length >= 3) return latin.slice(0, 3).toUpperCase()
  if (latin.length > 0) return latin.toUpperCase().padEnd(3, 'X')
  return 'CARD'
}

/** Assigns stable identifiers like OMS-001 based on card creation order across the board. */
export function buildIdentifierMap(board: BoardWithColumns): Map<string, string> {
  const prefix = deriveBoardPrefix(board.title)
  const all = board.columns.flatMap((c) => c.cards)
  all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const map = new Map<string, string>()
  all.forEach((card, i) => {
    map.set(card.id, `${prefix}-${String(i + 1).padStart(3, '0')}`)
  })
  return map
}
