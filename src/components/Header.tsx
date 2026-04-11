interface HeaderProps {
  boardTitle?: string
  onBack?: () => void
}

export function Header({ boardTitle, onBack }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center gap-4">
      {onBack && (
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 text-sm cursor-pointer"
        >
          &larr; Back
        </button>
      )}
      <h1 className="text-xl font-bold text-gray-800">
        {boardTitle ?? 'Kanban Board'}
      </h1>
    </header>
  )
}
