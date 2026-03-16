import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

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
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      show={isOpen}
      onHide={isConfirming ? undefined : onCancel}
      centered
      backdrop={isConfirming ? "static" : true}
      keyboard={!isConfirming}
      contentClassName="border-0 rounded-5 shadow-lg bg-light"
    >
      <Modal.Header
        closeButton={!isConfirming}
        className="border-0 pb-0 px-4 pt-4"
      >
        <div>
          <p
            className="mb-2 text-uppercase fw-bold small text-secondary"
            style={{ letterSpacing: "0.16em" }}
          >
            Please confirm
          </p>
          <Modal.Title as="h2" className="fs-3 fw-bold text-dark">
            {title}
          </Modal.Title>
        </div>
      </Modal.Header>

      <Modal.Body className="px-4 pt-3 pb-2 text-secondary">
        <p className="mb-0 lh-lg">{message}</p>
      </Modal.Body>

      <Modal.Footer className="border-0 px-4 pb-4 pt-2 gap-2">
        <Button
          variant="outline-secondary"
          className="rounded-pill px-4 fw-semibold"
          onClick={onCancel}
          disabled={isConfirming}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="danger"
          className="rounded-pill px-4 fw-semibold"
          onClick={onConfirm}
          disabled={isConfirming}
        >
          {isConfirming ? "Working..." : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmDialog;
