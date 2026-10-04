import { useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../services/database';
import { cellKey, createDailyCrossword, kyivPuzzleDate, type PlacedWord } from '../utils/crossword';

interface Props { now: Date; onError: (message: string) => void; }

export default function CrosswordPage({ now, onError }: Props) {
  const date = kyivPuzzleDate(now);
  const puzzle = useMemo(() => createDailyCrossword(date), [date]);
  const [cells, setCells] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<PlacedWord | null>(puzzle.words[0] ?? null);
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const inputRefs = useRef(new Map<string, HTMLInputElement>());

  useEffect(() => {
    setLoaded(false);
    setWrong(new Set());
    setSelected(puzzle.words[0] ?? null);
    void api.loadCrosswordProgress(date).then((progress) => {
      setCells(progress?.cells ?? {});
      setCompleted(progress?.completed ?? false);
    }).catch(() => onError('Не удалось загрузить прогресс кроссворда.')).finally(() => setLoaded(true));
  }, [date, onError, puzzle.words]);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      void api.saveCrosswordProgress(date, cells, completed).catch(() => onError('Не удалось сохранить прогресс кроссворда.'));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [cells, completed, date, loaded, onError]);

  const wordsByCell = useMemo(() => {
    const map = new Map<string, PlacedWord[]>();
    for (const word of puzzle.words) for (let i = 0; i < word.answer.length; i++) {
      const key = cellKey(word.row + (word.direction === 'down' ? i : 0), word.col + (word.direction === 'across' ? i : 0));
      map.set(key, [...(map.get(key) ?? []), word]);
    }
    return map;
  }, [puzzle]);

  const wordKeys = (word: PlacedWord) => Array.from({ length: word.answer.length }, (_, index) =>
    cellKey(word.row + (word.direction === 'down' ? index : 0), word.col + (word.direction === 'across' ? index : 0)));

  const chooseCell = (key: string) => {
    const options = wordsByCell.get(key) ?? [];
    const next = options.length > 1 && selected === options[0] ? options[1] : options[0];
    if (next) setSelected(next);
  };

  const enterLetter = (key: string, value: string) => {
    const letter = value.toUpperCase().replace(/[^А-ЯЁ]/g, '').slice(-1);
    setWrong((current) => { const next = new Set(current); next.delete(key); return next; });
    setCells((current) => ({ ...current, [key]: letter }));
    if (!letter) return;
    const activeWord = selected && wordKeys(selected).includes(key) ? selected : wordsByCell.get(key)?.[0];
    if (!activeWord) return;
    const keys = wordKeys(activeWord);
    const nextKey = keys[keys.indexOf(key) + 1];
    if (nextKey) inputRefs.current.get(nextKey)?.focus();
  };

  const check = () => {
    const errors = new Set<string>();
    let allFilled = true;
    for (const [key, answer] of puzzle.solution) {
      if (!cells[key]) allFilled = false;
      else if (cells[key] !== answer) errors.add(key);
    }
    setWrong(errors);
    const solved = allFilled && errors.size === 0;
    setCompleted(solved);
    if (!solved && !allFilled) onError('Заполнены ещё не все клетки.');
  };

  const reset = () => {
    if (!window.confirm('Очистить весь личный прогресс за сегодня?')) return;
    setCells({}); setWrong(new Set()); setCompleted(false);
  };

  if (!loaded) return <div className="notice notice--plain">Загружаем кроссворд…</div>;
  const activeKeys = new Set(selected ? wordKeys(selected) : []);

  return <section className="page-window crossword-page">
    <div className="window-titlebar"><h2 className="window-titlebar__text">ИНЖЕНЕРНЫЙ КРОССВОРД ДНЯ — {date.split('-').reverse().join('.')}</h2></div>
    <div className="crossword-status">
      <span>Слов: {puzzle.words.length} · Прогресс сохраняется автоматически</span>
      {completed && <strong>КРОССВОРД РЕШЁН</strong>}
    </div>
    <div className="crossword-layout">
      <div className="crossword-grid-wrap">
        <div className="crossword-grid" style={{ gridTemplateColumns: `repeat(${puzzle.cols}, 31px)`, gridTemplateRows: `repeat(${puzzle.rows}, 31px)` }}>
          {Array.from({ length: puzzle.rows * puzzle.cols }, (_, index) => {
            const row = Math.floor(index / puzzle.cols); const col = index % puzzle.cols; const key = cellKey(row, col);
            if (!puzzle.solution.has(key)) return <span className="crossword-cell crossword-cell--block" key={key} />;
            return <label className={`crossword-cell${activeKeys.has(key) ? ' crossword-cell--active' : ''}${wrong.has(key) ? ' crossword-cell--wrong' : ''}`} key={key}>
              {puzzle.numbers.has(key) && <span className="crossword-cell__number">{puzzle.numbers.get(key)}</span>}
              <input ref={(node) => { if (node) inputRefs.current.set(key, node); else inputRefs.current.delete(key); }} value={cells[key] ?? ''} maxLength={1} aria-label={`Клетка ${row + 1}, ${col + 1}`} onFocus={() => chooseCell(key)} onChange={(event) => enterLetter(key, event.target.value)} />
            </label>;
          })}
        </div>
      </div>
      <aside className="crossword-clues">
        <div className="crossword-clues__column"><h3>ПО ГОРИЗОНТАЛИ</h3>{puzzle.words.filter((word) => word.direction === 'across').sort((a, b) => a.number - b.number).map((word) => <button className={selected === word ? 'crossword-clue crossword-clue--active' : 'crossword-clue'} onClick={() => { setSelected(word); inputRefs.current.get(wordKeys(word)[0])?.focus(); }} key={`${word.number}-${word.direction}`}><strong>{word.number}.</strong> {word.clue}<small>{word.topic}</small></button>)}</div>
        <div className="crossword-clues__column"><h3>ПО ВЕРТИКАЛИ</h3>{puzzle.words.filter((word) => word.direction === 'down').sort((a, b) => a.number - b.number).map((word) => <button className={selected === word ? 'crossword-clue crossword-clue--active' : 'crossword-clue'} onClick={() => { setSelected(word); inputRefs.current.get(wordKeys(word)[0])?.focus(); }} key={`${word.number}-${word.direction}`}><strong>{word.number}.</strong> {word.clue}<small>{word.topic}</small></button>)}</div>
      </aside>
    </div>
    <div className="crossword-actions"><button className="btn btn--primary" onClick={check}>Проверить</button><button className="btn btn--danger-outline" onClick={reset}>Очистить</button></div>
  </section>;
}
