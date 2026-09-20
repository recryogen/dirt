import { deadlineTone, formatDate } from '../utils/deadline';
import type { DirtyGroup } from '../utils/sorting';

interface Props {
  nickname: string;
  groups: DirtyGroup[];
  revealed: boolean;
  onOpenTask: (taskId: string) => void;
}

/** Постоянное центральное окно с результатом кнопки «Сделать грязь». */
export default function DirtyList({ nickname, groups, revealed, onOpenTask }: Props) {
  const items = groups.flatMap((group) => group.items);

  return (
    <section className="dirty-window" aria-live="polite">
      <div className="window-titlebar">
        <h2 className="window-titlebar__text">Отсортированные задания</h2>
      </div>
      <div className="dirty-window__body">
        {!revealed ? (
          <div className="dirty-placeholder">
            <p className="dirty-placeholder__title">Список пока не сформирован</p>
            <p>Введите имя и нажмите кнопку «Сделать грязь».</p>
          </div>
        ) : items.length === 0 ? (
          <div className="dirty-placeholder">
            <p className="dirty-placeholder__title">Список пуст</p>
            <p>Для пользователя «{nickname}» нет невыполненных заданий.</p>
          </div>
        ) : (
          <>
            <div className="dirty-summary">
              <span>Пользователь: <strong>{nickname}</strong></span>
              <span>Невыполнено: <strong>{items.length}</strong></span>
            </div>
            <ol className="dirty-list">
              {items.map((item, index) => (
                <li key={item.task.id}>
                  <button
                    type="button"
                    className={`dirty-item dirty-item--${deadlineTone(item.daysLeft)}`}
                    onClick={() => onOpenTask(item.task.id)}
                  >
                    <span className="dirty-item__index">{index + 1}.</span>
                    <span className="dirty-item__content">
                      <span className="dirty-item__subject">{item.subject.name}</span>
                      <span className="dirty-item__title">№{item.number} — {item.task.title}</span>
                    </span>
                    <span className="dirty-item__deadline">
                      <span>{formatDate(item.task.deadline)}</span>
                      <strong>{item.daysLeft} дн.</strong>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </section>
  );
}
