import type { Task } from '../types';

/**
 * Нумерация заданий.
 *
 * Номер, который видит пользователь, — это позиция задания в своей дисциплине
 * (1, 2, 3…). Он вычисляется из порядка (поле number, при равенстве — по дате
 * создания), а не вводится руками. Поэтому после удаления или перестановки
 * номера всегда идут подряд без дыр. Поле number в базе выравнивается тем же
 * порядком (см. normalizeNumbers), чтобы порядок был одинаковым у всех.
 */

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    return a.created_at.localeCompare(b.created_at);
  });
}

/** Карта «id задания → отображаемый номер» для всех дисциплин сразу. */
export function buildNumbering(tasks: Task[]): Map<string, number> {
  const bySubject = new Map<string, Task[]>();
  for (const task of tasks) {
    const list = bySubject.get(task.subject_id);
    if (list) list.push(task);
    else bySubject.set(task.subject_id, [task]);
  }
  const result = new Map<string, number>();
  for (const list of bySubject.values()) {
    sortTasks(list).forEach((task, index) => result.set(task.id, index + 1));
  }
  return result;
}

/**
 * Какие задания нужно обновить в базе, чтобы number совпал с позицией 1..N.
 * Возвращает только реально изменившиеся.
 */
export function normalizeNumbers(ordered: Task[]): { id: string; number: number }[] {
  const updates: { id: string; number: number }[] = [];
  ordered.forEach((task, index) => {
    if (task.number !== index + 1) updates.push({ id: task.id, number: index + 1 });
  });
  return updates;
}
