import { TASK_TYPE_LABELS } from '../config';
import type { Task as TaskModel } from '../types';
import { deadlineTone, formatDate, formatDaysLeft } from '../utils/deadline';

interface Props {
  task: TaskModel;
  number: number;
  daysLeft: number;
  /** Текущий пользователь уже выполнил это задание */
  done: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onOpen: () => void;
  onMove: (direction: -1 | 1) => void;
}

/** Строка задания внутри дисциплины. */
export default function Task({ task, number, daysLeft, done, canMoveUp, canMoveDown, onOpen, onMove }: Props) {
  const tone = deadlineTone(daysLeft);

  return (
    <li className={`task${done ? ' task--done' : ''}`}>
      <button type="button" className="task__main" onClick={onOpen}>
        <span className="task__number">{number}.</span>
        <span className="task__info">
          <span className="task__title">
            {task.title}
            {task.importance === 'important' && (
              <span className="task__flag" title="Важное">
                ВАЖНО
              </span>
            )}
          </span>
          <span className="task__meta">
            {TASK_TYPE_LABELS[task.type]}, до {formatDate(task.deadline)}
          </span>
        </span>
        {done ? (
          <span className="badge badge--done">выполнено</span>
        ) : (
          <span className={`badge badge--${tone}`}>{formatDaysLeft(daysLeft)}</span>
        )}
      </button>
      <span className="task__move">
        <button
          type="button"
          className="icon-btn icon-btn--small"
          onClick={() => onMove(-1)}
          disabled={!canMoveUp}
          aria-label="Поднять выше"
          title="Поднять выше"
        >
          ↑
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--small"
          onClick={() => onMove(1)}
          disabled={!canMoveDown}
          aria-label="Опустить ниже"
          title="Опустить ниже"
        >
          ↓
        </button>
      </span>
    </li>
  );
}
