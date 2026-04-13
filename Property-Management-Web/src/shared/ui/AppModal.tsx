import { useEffect } from 'react'
import type { ReactNode } from 'react'

type AppModalProps = {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export function AppModal({ title, isOpen, onClose, children }: AppModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="app-modal-header">
          <h4>{title}</h4>
          <button
            type="button"
            className="secondary-button app-modal-close"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            Close
          </button>
        </div>
        <div className="app-modal-body">{children}</div>
      </div>
    </div>
  )
}

AppModal.displayName = 'AppModal'
