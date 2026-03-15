import Button from 'react-bootstrap/Button';
import Toast from 'react-bootstrap/Toast';
import './FeedbackToast.css';

type FeedbackToastProps = {
  show: boolean;
  title: string;
  message: string;
  variant?: 'success' | 'danger';
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  autoHideDelay?: number;
};

function FeedbackToast({
  show,
  title,
  message,
  variant = 'success',
  onClose,
  actionLabel,
  onAction,
  className = '',
  autoHideDelay = 4000,
}: FeedbackToastProps) {
  const icon = variant === 'success' ? '✓' : '!';

  return (
    <Toast
      show={show}
      className={`feedback-toast feedback-toast--${variant} position-absolute top-0 end-0 m-3 border-0 ${className}`.trim()}
      onClose={onClose}
      autohide
      delay={autoHideDelay}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Toast.Header className="feedback-toast__header border-0">
        <span className="feedback-toast__icon" aria-hidden="true">
          {icon}
        </span>
        <strong className="me-auto feedback-toast__title">{title}</strong>
      </Toast.Header>
      <Toast.Body className="feedback-toast__body">
        <p className="feedback-toast__message mb-0">{message}</p>
        {actionLabel && onAction ? (
          <Button type="button" variant="light" size="sm" className="feedback-toast__action mt-3 rounded-pill px-3 fw-semibold" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Toast.Body>
    </Toast>
  );
}

export default FeedbackToast;