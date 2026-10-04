import { useEffect, useState } from 'react';
import * as api from '../services/database';

export default function JokeBanner() {
  const [text, setText] = useState('Загружаем анекдот…');
  useEffect(() => {
    let active = true;
    void api.loadDailyJoke().then((value) => active && setText(value)).catch(() => active && setText('Анекдот дня не загрузился.'));
    return () => { active = false; };
  }, []);
  return (
    <section className="joke-banner" aria-live="polite">
      <strong className="joke-banner__label">АНЕКДОТ ДНЯ:</strong>
      <span>{text}</span>
    </section>
  );
}
