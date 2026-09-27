import { useState, type FormEvent } from 'react';
import { NICKNAME_MAX_LENGTH } from '../config';
import Modal from './Modal';

interface Props {
  mode: 'login' | 'register';
  onSubmit: (nickname: string, password: string) => Promise<void>;
  onSwitchMode: () => void;
  onClose: () => void;
}

export default function LoginModal({
  mode,
  onSubmit,
  onSwitchMode,
  onClose,
}: Props) {
  const [value, setValue] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nick = value.trim().replace(/\s+/g, ' ');
    if (!nick) {
      setError('Введите имя или ник.');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов.');
      return;
    }
    if (isRegister && password !== repeatPassword) {
      setError('Пароли не совпадают.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit(nick, password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось выполнить вход.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={isRegister ? 'Регистрация' : 'Вход'} onClose={onClose}>
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
        <label className="field">
          <span className="field__label">Пароль:</span>
          <input
            className="input"
            type="password"
            value={password}
            minLength={6}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
          />
        </label>
        {isRegister && (
          <label className="field">
            <span className="field__label">Повторите пароль:</span>
            <input
              className="input"
              type="password"
              value={repeatPassword}
              minLength={6}
              autoComplete="new-password"
              onChange={(e) => {
                setRepeatPassword(e.target.value);
                setError('');
              }}
            />
          </label>
        )}
        {error && <p className="field__error">{error}</p>}
        {isRegister && <p className="hint">Имя станет вашим постоянным логином. Минимальная длина пароля — 6 символов.</p>}
        <div className="form__actions">
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
          <button type="button" className="btn btn--outline" onClick={onSwitchMode} disabled={busy}>
            {isRegister ? 'Уже есть аккаунт' : 'Создать аккаунт'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Закрыть
          </button>
        </div>
      </form>
    </Modal>
  );
}
