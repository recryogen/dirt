import { useState, type FormEvent } from 'react';
import { NICKNAME_MAX_LENGTH } from '../config';
import Modal from './Modal';

interface Props {
  /** Текущий ник (при смене имени) */
  initialValue?: string;
  title?: string;
  submitLabel?: string;
  onSubmit: (nickname: string) => void;
  onClose: () => void;
}

export default function LoginModal({
  initialValue = '',
  title = 'Вход',
  submitLabel = 'Войти',
  onSubmit,
  onClose,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');
  const isRename = Boolean(initialValue);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nick = value.trim().replace(/\s+/g, ' ');
    if (!nick) {
      setError('Введите имя или ник.');
      return;
    }
    onSubmit(nick);
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Введите ваше имя / ник:</span>
          <input
            className="input"
            type="text"
            value={value}
            maxLength={NICKNAME_MAX_LENGTH}
            autoFocus
            autoComplete="nickname"
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
          />
        </label>
        {error && <p className="field__error">{error}</p>}
        {isRename && (
          <p className="hint">
            Отметки о выполнении привязаны к нику. После смены имени старые отметки останутся за прежним ником.
          </p>
        )}
        <div className="form__actions">
          <button type="submit" className="btn btn--primary">
            {submitLabel}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Отмена
          </button>
        </div>
      </form>
    </Modal>
  );
}
