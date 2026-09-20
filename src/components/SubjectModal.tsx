import { useState, type FormEvent } from 'react';
import Modal from './Modal';

interface Props {
  /** Если передано — окно переименования */
  initialName?: string;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

export default function SubjectModal({ initialName, onSubmit, onClose }: Props) {
  const isEdit = initialName !== undefined;
  const [name, setName] = useState(initialName ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Введите название дисциплины.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Переименовать дисциплину' : 'Новая дисциплина'} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Название дисциплины:</span>
          <input
            className="input"
            type="text"
            value={name}
            maxLength={120}
            autoFocus
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
          />
        </label>
        {error && <p className="field__error">{error}</p>}
        <div className="form__actions">
          <button type="submit" className="btn btn--success" disabled={busy}>
            {isEdit ? 'Сохранить' : 'Создать'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Отмена
          </button>
        </div>
      </form>
    </Modal>
  );
}
