import { DIRTY_GROUPS, type DirtyGroupKey } from '../config';
import type { AppData, Subject, Task } from '../types';
import { daysUntil, isUrgent } from './deadline';

export interface DirtyItem {
  task: Task;
  subject: Subject;
  number: number;
  daysLeft: number;
  urgent: boolean;
}

export interface DirtyGroup {
  key: DirtyGroupKey;
  title: string;
  tone: 'red' | 'amber' | 'green' | 'gray';
  items: DirtyItem[];
}

/**
 * «Сделать грязь».
 *
 * 1. Берём все задания всех дисциплин.
 * 2. Выкидываем те, которые текущий пользователь уже выполнил (по нику, без учёта регистра).
 * 3. Для каждого считаем дни до дедлайна (могут быть отрицательными) и срочность.
 * 4. Раскладываем по 4 группам: важное+срочное, важное+не срочное,
 *    неважное+срочное, неважное+не срочное.
 * 5. Внутри группы сортируем по дням до дедлайна по возрастанию
 *    (−5 выше, чем −1, выше, чем 0, выше, чем 3).
 *
 * Пустые группы возвращаются пустыми — интерфейс сам решает, что показать.
 */
export function buildDirtyList(
  data: AppData,
  nickname: string,
  numbering: Map<string, number>,
  today: Date = new Date(),
): DirtyGroup[] {
  const me = nickname.trim().toLowerCase();
  const subjects = new Map(data.subjects.map((s) => [s.id, s]));

  const doneByMe = new Set(
    data.completions.filter((c) => c.nickname.trim().toLowerCase() === me).map((c) => c.task_id),
  );

  const groups: DirtyGroup[] = DIRTY_GROUPS.map((g) => ({
    key: g.key,
    title: g.title,
    tone: g.tone,
    items: [],
  }));

  for (const task of data.tasks) {
    if (doneByMe.has(task.id)) continue;
    const subject = subjects.get(task.subject_id);
    if (!subject) continue;

    const daysLeft = daysUntil(task.deadline, today);
    const urgent = isUrgent(daysLeft);
    const important = task.importance === 'important';

    const index = DIRTY_GROUPS.findIndex((g) => g.important === important && g.urgent === urgent);
    groups[index].items.push({
      task,
      subject,
      number: numbering.get(task.id) ?? task.number,
      daysLeft,
      urgent,
    });
  }

  for (const group of groups) {
    group.items.sort((a, b) => {
      if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft;
      // одинаковые дедлайны — стабильный порядок: дисциплина, затем номер
      const bySubject = a.subject.name.localeCompare(b.subject.name, 'ru');
      if (bySubject !== 0) return bySubject;
      return a.number - b.number;
    });
  }

  return groups;
}
