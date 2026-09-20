import { useState } from 'react';
import Modal from './Modal';

interface Props {
  title?: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title = 'Подтверждение',
  message,
  confirmLabel = 'Удалить',
  onConfirm,
  onCancel,
}: Props) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={onCancel}>
      <p className="confirm__text">{message}</p>
      <div className="form__actions">
        <button type="button" className="btn btn--danger" onClick={handleConfirm} disabled={busy} autoFocus>
          {confirmLabel}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Отмена
        </button>
      </div>
    </Modal>
  );
}
