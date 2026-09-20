import { useCallback, useState } from 'react';
import { NICKNAME_STORAGE_KEY } from './config';

function readNickname(): string {
  try {
    return localStorage.getItem(NICKNAME_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

/** Ник текущего пользователя, сохранённый в браузере. */
export function useNickname(): [string, (value: string) => void] {
  const [nickname, setNicknameState] = useState<string>(readNickname);

  const setNickname = useCallback((value: string) => {
    setNicknameState(value);
    try {
      if (value) localStorage.setItem(NICKNAME_STORAGE_KEY, value);
      else localStorage.removeItem(NICKNAME_STORAGE_KEY);
    } catch {
      /* приватный режим браузера — просто не сохраняем */
    }
  }, []);

  return [nickname, setNickname];
}
