import { useEffect } from 'react';
import './ConfirmDialog.css';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isConfirming) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isConfirming, isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-dialog" role="presentation">
      <button
        type="button"
        className="confirm-dialog__backdrop"
        aria-label="Close confirmation dialog"
        onClick={onCancel}
        disabled={isConfirming}
      />

      <section className="confirm-dialog__surface" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <p className="confirm-dialog__eyebrow">Please confirm</p>
        <h2 id="confirm-dialog-title" className="confirm-dialog__title">{title}</h2>
        <p className="confirm-dialog__message">{message}</p>

        <div className="confirm-dialog__actions">
          <button type="button" className="btn btn-outline-secondary rounded-pill px-4 fw-semibold confirm-dialog__button" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-danger rounded-pill px-4 fw-semibold confirm-dialog__button" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Working...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;