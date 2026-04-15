import { AppModal } from './AppModal'

type ConfirmationModalProps = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isOpen: boolean
  isConfirming?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isOpen,
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <AppModal title={title} isOpen={isOpen} onClose={onCancel}>
      <div className="confirmation-modal-body">
        <p>{message}</p>
        <div className="confirmation-modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={isConfirming}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </AppModal>
  )
}

ConfirmationModal.displayName = 'ConfirmationModal'
