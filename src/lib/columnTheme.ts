export interface ColumnTheme {
  badge: string
  dot: string
  label: 'todo' | 'doing' | 'review' | 'done' | 'blocked' | 'backlog' | 'default'
}

const KEYWORD_MAP: Array<{ test: RegExp; theme: ColumnTheme }> = [
  {
    test: /done|complete|完成|已完成|finished/i,
    theme: {
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      label: 'done',
    },
  },
  {
    test: /doing|progress|进行|in[- ]?progress/i,
    theme: {
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      dot: 'bg-blue-500',
      label: 'doing',
    },
  },
  {
    test: /review|审查|审核|qa|test/i,
    theme: {
      badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
      dot: 'bg-violet-500',
      label: 'review',
    },
  },
  {
    test: /block|阻塞|停滞|hold/i,
    theme: {
      badge: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
      dot: 'bg-red-500',
      label: 'blocked',
    },
  },
  {
    test: /backlog|积压|待规划/i,
    theme: {
      badge: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300',
      dot: 'bg-zinc-400',
      label: 'backlog',
    },
  },
  {
    test: /todo|待办|to[- ]?do|planned/i,
    theme: {
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300',
      dot: 'bg-slate-400',
      label: 'todo',
    },
  },
]

const DEFAULT_THEME: ColumnTheme = {
  badge: 'bg-muted text-muted-foreground',
  dot: 'bg-muted-foreground/60',
  label: 'default',
}

export function resolveColumnTheme(title: string): ColumnTheme {
  for (const { test, theme } of KEYWORD_MAP) {
    if (test.test(title)) return theme
  }
  return DEFAULT_THEME
}
