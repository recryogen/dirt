import type { Category as CategoryModel, Subject as SubjectModel, Task as TaskModel } from '../types';
import Subject from './Subject';

interface Props {
  category: CategoryModel;
  subjects: SubjectModel[];
  /** Задания по id дисциплины, уже отсортированные */
  tasksBySubject: Map<string, TaskModel[]>;
  numbering: Map<string, number>;
  doneIds: Set<string>;
  today: Date;
  onAddSubject: () => void;
  onAddTask: (subject: SubjectModel) => void;
  onRenameSubject: (subject: SubjectModel) => void;
  onDeleteSubject: (subject: SubjectModel) => void;
  onToggleSubjectVisibility: (subject: SubjectModel) => void;
  onOpenTask: (taskId: string) => void;
  onMoveTask: (subjectId: string, taskId: string, direction: -1 | 1) => void;
}

/** Категория («Чето серьезное» / «Хуйня») со списком дисциплин. */
export default function Category({
  category,
  subjects,
  tasksBySubject,
  numbering,
  doneIds,
  today,
  onAddSubject,
  onAddTask,
  onRenameSubject,
  onDeleteSubject,
  onToggleSubjectVisibility,
  onOpenTask,
  onMoveTask,
}: Props) {
  return (
    <section className="category">
      <div className="category__head">
        <h2 className="category__name">{category.name}</h2>
        <button
          type="button"
          className="plus-btn"
          onClick={onAddSubject}
          title="Добавить дисциплину"
          aria-label={`Добавить дисциплину в категорию «${category.name}»`}
        >
          +
        </button>
      </div>

      {subjects.length === 0 ? (
        <p className="category__empty">Дисциплин пока нет. Нажмите +, чтобы создать первую.</p>
      ) : (
        <div className="subject-grid">
          {subjects.map((subject) => (
            <Subject
              key={subject.id}
              subject={subject}
              tasks={tasksBySubject.get(subject.id) ?? []}
              numbering={numbering}
              doneIds={doneIds}
              today={today}
              onAddTask={() => onAddTask(subject)}
              onRename={() => onRenameSubject(subject)}
              onDelete={() => onDeleteSubject(subject)}
              onToggleVisibility={() => onToggleSubjectVisibility(subject)}
              onOpenTask={onOpenTask}
              onMoveTask={(taskId, dir) => onMoveTask(subject.id, taskId, dir)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
