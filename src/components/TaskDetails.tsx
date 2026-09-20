import { useState } from 'react';
import { IMPORTANCE_LABELS, TASK_TYPE_LABELS } from '../config';
import type { Completion, Task } from '../types';
import { deadlineTone, formatDate, formatDaysLeft } from '../utils/deadline';
import Modal from './Modal';

interface Props {
  task: Task;
  subjectName: string;
  number: number;
  daysLeft: number;
  completions: Completion[];
  /** Ник текущего пользователя (пустая строка, если не вошёл) */
  nickname: string;
  onToggleDone: () => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function TaskDetails({
  task,
  subjectName,
  number,
  daysLeft,
  completions,
  nickname,
  onToggleDone,
  onEdit,
  onDelete,
  onClose,
}: Props) {
  const [busy, setBusy] = useState(false);
  const me = nickname.trim().toLowerCase();
  const doneByMe = me !== '' && completions.some((c) => c.nickname.trim().toLowerCase() === me);
  const tone = deadlineTone(daysLeft);

  const toggle = async () => {
    setBusy(true);
    try {
      await onToggleDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`${TASK_TYPE_LABELS[task.type]} №${number}`} onClose={onClose} wide>
      <div className="details">
        <p className="details__subject">{subjectName}</p>
        <p className="details__title">{task.title}</p>

        <dl className="details__grid">
          <dt>Тип</dt>
          <dd>{TASK_TYPE_LABELS[task.type]}</dd>

          <dt>Важность</dt>
          <dd>{IMPORTANCE_LABELS[task.importance]}</dd>

          <dt>Дедлайн</dt>
          <dd>{formatDate(task.deadline)}</dd>

          <dt>До дедлайна</dt>
          <dd>
            <span className={`badge badge--${tone}`}>{formatDaysLeft(daysLeft)}</span>
          </dd>
        </dl>

        <div className="details__block">
          <h3 className="details__heading">ТЗ</h3>
          {task.description ? (
            <p className="details__text">{task.description}</p>
          ) : (
            <p className="details__text details__text--muted">Описание не добавлено.</p>
          )}
        </div>

        <div className="details__block">
          <h3 className="details__heading">Выполнили{completions.length > 0 ? ` (${completions.length})` : ''}</h3>
          {completions.length === 0 ? (
            <p className="details__text details__text--muted">Пока никто.</p>
          ) : (
            <ul className="done-list">
              {completions.map((c) => (
                <li key={c.id} className={c.nickname.trim().toLowerCase() === me ? 'done-list__me' : undefined}>
                  {c.nickname}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form__actions form__actions--wrap">
          {doneByMe ? (
            <>
              <span className="btn btn--success btn--static">Я выполнил</span>
              <button type="button" className="btn btn--outline" onClick={toggle} disabled={busy}>
                Я ещё не выполнил
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--success" onClick={toggle} disabled={busy}>
              Я выполнил
            </button>
          )}
          <button type="button" className="btn btn--outline" onClick={onEdit} disabled={busy}>
            Редактировать
          </button>
          <button type="button" className="btn btn--danger-outline" onClick={onDelete} disabled={busy}>
            Удалить
          </button>
        </div>
      </div>
    </Modal>
  );
}
