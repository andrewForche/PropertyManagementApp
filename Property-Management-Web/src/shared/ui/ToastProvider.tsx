import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'

type ToastTone = 'success' | 'error'

type ToastInput = {
  title: string
  message?: string
  tone: ToastTone
}

type ToastRecord = ToastInput & {
  id: number
}

type ToastContextValue = {
  showToast: (toast: ToastInput) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const nextToastId = useRef(1)

  const removeToast = useCallback((toastId: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }, [])

  const showToast = useCallback(
    (toast: ToastInput) => {
      const toastId = nextToastId.current++
      setToasts((current) => [...current, { ...toast, id: toastId }])

      window.setTimeout(() => {
        removeToast(toastId)
      }, 4200)
    },
    [removeToast],
  )

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      showToast,
      showSuccess: (title: string, message?: string) =>
        showToast({ title, message, tone: 'success' }),
      showError: (title: string, message?: string) =>
        showToast({ title, message, tone: 'error' }),
    }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card ${toast.tone}`}>
            <div className="toast-copy">
              <strong>{toast.title}</strong>
              {toast.message ? <p>{toast.message}</p> : null}
            </div>
            <button
              type="button"
              className="toast-dismiss"
              onClick={() => removeToast(toast.id)}
              aria-label={`Dismiss ${toast.title}`}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

ToastProvider.displayName = 'ToastProvider'

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within ToastProvider.')
  }

  return context
}
