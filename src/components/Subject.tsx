import type { Subject as SubjectModel, Task as TaskModel } from '../types';
import { daysUntil } from '../utils/deadline';
import Task from './Task';

interface Props {
  subject: SubjectModel;
  /** Задания дисциплины, уже отсортированные по порядку */
  tasks: TaskModel[];
  numbering: Map<string, number>;
  /** id заданий, которые выполнил текущий пользователь */
  doneIds: Set<string>;
  today: Date;
  onAddTask: () => void;
  onRename: () => void;
  onDelete: () => void;
  onOpenTask: (taskId: string) => void;
  onMoveTask: (taskId: string, direction: -1 | 1) => void;
}

/** Блок одной дисциплины со списком заданий. */
export default function Subject({
  subject,
  tasks,
  numbering,
  doneIds,
  today,
  onAddTask,
  onRename,
  onDelete,
  onOpenTask,
  onMoveTask,
}: Props) {
  return (
    <section className="subject">
      <div className="subject__head">
        <h3 className="subject__name">{subject.name}</h3>
        <div className="subject__actions">
          <button type="button" className="icon-btn icon-btn--small" onClick={onRename} title="Переименовать" aria-label="Переименовать дисциплину">
            Изм.
          </button>
          <button type="button" className="icon-btn icon-btn--small icon-btn--danger" onClick={onDelete} title="Удалить" aria-label="Удалить дисциплину">
            Удал.
          </button>
          <button type="button" className="plus-btn plus-btn--small" onClick={onAddTask} title="Добавить задание" aria-label={`Добавить задание в «${subject.name}»`}>
            +
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="subject__empty">Заданий пока нет. Добавьте первое кнопкой +.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task, index) => (
            <Task
              key={task.id}
              task={task}
              number={numbering.get(task.id) ?? index + 1}
              daysLeft={daysUntil(task.deadline, today)}
              done={doneIds.has(task.id)}
              canMoveUp={index > 0}
              canMoveDown={index < tasks.length - 1}
              onOpen={() => onOpenTask(task.id)}
              onMove={(dir) => onMoveTask(task.id, dir)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
