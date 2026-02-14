import { useEffect } from 'react'
import { Icons } from './Icons'

const AUTO_DISMISS_MS = 5000

export default function Toast({ message, onUndo, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 toast-enter">
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-lg shadow-lg">
        <Icons.Check />
        <span className="text-sm font-medium">{message}</span>

        {onUndo && (
          <button
            onClick={onUndo}
            aria-label="Undo"
            className="ml-2 px-2 py-1 text-sm font-medium text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            Undo
          </button>
        )}

        <button
          onClick={onClose}
          aria-label="Close"
          className="ml-1 p-1 hover:bg-slate-700 rounded transition-colors"
        >
          <Icons.X />
        </button>
      </div>
    </div>
  )
}
