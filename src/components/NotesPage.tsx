import { useCallback, useEffect, useState } from 'react';
import * as api from '../services/database';
import type { SharedNote } from '../types';

interface Props { nickname: string; onError: (message: string) => void; }

export default function NotesPage({ nickname, onError }: Props) {
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setNotes(await api.loadNotes()); }
    catch { onError('Не удалось загрузить заметки.'); }
  }, [onError]);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    try { await api.createNote(draft.trim(), nickname); setDraft(''); await load(); }
    catch { onError('Не удалось создать заметку.'); }
    finally { setBusy(false); }
  };
  const save = async (id: string) => {
    if (!editText.trim()) return;
    setBusy(true);
    try { await api.updateNote(id, editText.trim()); setEditing(null); await load(); }
    catch { onError('Не удалось изменить заметку.'); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    if (!window.confirm('Удалить эту общую заметку?')) return;
    try { await api.deleteNote(id); await load(); }
    catch { onError('Не удалось удалить заметку.'); }
  };

  return (
    <section className="page-window">
      <div className="window-titlebar"><h2 className="window-titlebar__text">ОБЩИЕ ЗАМЕТКИ</h2></div>
      <div className="note-composer">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000} placeholder="Напишите заметку — её увидят все пользователи…" />
        <button className="btn btn--success" type="button" onClick={() => void create()} disabled={busy || !draft.trim()}>Добавить заметку</button>
      </div>
      <div className="notes-board">
        {notes.length === 0 && <div className="schedule-empty">Заметок пока нет.</div>}
        {notes.map((note, index) => (
          <article className={`sticky-note sticky-note--${index % 4}`} key={note.id}>
            {editing === note.id ? <textarea value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={2000} /> : <p>{note.content}</p>}
            <footer><span>{note.author_nickname} · {new Date(note.updated_at).toLocaleString('ru-RU')}</span><div>
              {editing === note.id ? <><button className="btn" onClick={() => void save(note.id)} disabled={busy}>Сохранить</button><button className="btn" onClick={() => setEditing(null)}>Отмена</button></> : <button className="btn" onClick={() => { setEditing(note.id); setEditText(note.content); }}>Изменить</button>}
              <button className="btn btn--danger-outline" onClick={() => void remove(note.id)}>Удалить</button>
            </div></footer>
          </article>
        ))}
      </div>
    </section>
  );
}
