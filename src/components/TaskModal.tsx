import { useState, type FormEvent } from 'react';
import { IMPORTANCE_LABELS, TASK_TYPE_LABELS } from '../config';
import type { Importance, Task, TaskInput, TaskType } from '../types';
import Modal from './Modal';

interface Props {
  subjectName: string;
  /** Если передано — редактирование существующего задания */
  task?: Task;
  onSubmit: (input: TaskInput) => Promise<void>;
  onClose: () => void;
}

export default function TaskModal({ subjectName, task, onSubmit, onClose }: Props) {
  const isEdit = Boolean(task);
  const [title, setTitle] = useState(task?.title ?? '');
  const [type, setType] = useState<TaskType | ''>(task?.type ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [deadline, setDeadline] = useState(task?.deadline ?? '');
  const [importance, setImportance] = useState<Importance | ''>(task?.importance ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Введите название задания.';
    if (!type) next.type = 'Выберите тип задания.';
    if (!deadline) next.deadline = 'Укажите дедлайн.';
    if (!importance) next.importance = 'Выберите важность.';
    setErrors(next);
    if (Object.keys(next).length > 0 || !type || !importance) return;

    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        type,
        description: description.trim(),
        deadline,
        importance,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Редактировать задание' : 'Новое задание'} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <p className="hint hint--subject">Дисциплина: {subjectName}</p>

        <label className="field">
          <span className="field__label">Название задания:</span>
          <input
            className="input"
            type="text"
            value={title}
            maxLength={160}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && <span className="field__error">{errors.title}</span>}
        </label>

        <fieldset className="field field--group">
          <legend className="field__label">Тип задания:</legend>
          {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((value) => (
            <label key={value} className="radio">
              <input type="radio" name="type" checked={type === value} onChange={() => setType(value)} />
              <span>{TASK_TYPE_LABELS[value]}</span>
            </label>
          ))}
          {errors.type && <span className="field__error">{errors.type}</span>}
        </fieldset>

        <label className="field">
          <span className="field__label">ТЗ:</span>
          <textarea
            className="input input--area"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">Дедлайн:</span>
          <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          {errors.deadline && <span className="field__error">{errors.deadline}</span>}
        </label>

        <fieldset className="field field--group">
          <legend className="field__label">Важность:</legend>
          {(Object.keys(IMPORTANCE_LABELS) as Importance[]).map((value) => (
            <label key={value} className="radio">
              <input
                type="radio"
                name="importance"
                checked={importance === value}
                onChange={() => setImportance(value)}
              />
              <span>{IMPORTANCE_LABELS[value]}</span>
            </label>
          ))}
          {errors.importance && <span className="field__error">{errors.importance}</span>}
        </fieldset>

        <div className="form__actions">
          <button type="submit" className="btn btn--success" disabled={busy}>
            {isEdit ? 'Сохранить' : 'Создать задание'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Отмена
          </button>
        </div>
      </form>
    </Modal>
  );
}
