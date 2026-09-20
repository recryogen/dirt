import type { Importance, TaskType } from './types';

/**
 * ───────────────────────────────────────────────────────────────
 *  НАСТРОЙКИ ПРИЛОЖЕНИЯ — всё, что можно менять, лежит здесь
 * ───────────────────────────────────────────────────────────────
 */

/**
 * Срочность задания.
 * Задание СРОЧНОЕ, если до дедлайна осталось URGENT_DAYS дней или меньше
 * (включая сегодня и уже просроченные — у них число дней отрицательное).
 * Чтобы считать срочными задания «в ближайшие 5 дней», поставьте 5.
 */
export const URGENT_DAYS = 3;

/** Названия категорий. Именно такими они и создаются в базе. */
export const DEFAULT_CATEGORIES = [
  { name: 'Чето серьезное', sort_order: 1 },
  { name: 'Хуйня', sort_order: 2 },
];

/** Максимальная длина ника. */
export const NICKNAME_MAX_LENGTH = 40;

/** Ключ localStorage, под которым хранится ник. */
export const NICKNAME_STORAGE_KEY = 'study-dirt:nickname';

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  practical: 'Практическая работа',
  lab: 'Лабораторная работа',
};

export const IMPORTANCE_LABELS: Record<Importance, string> = {
  important: 'Важное',
  normal: 'Неважное',
};

/**
 * Группы «грязи» в порядке показа.
 * Порядок здесь = порядок сортировки:
 * важное+срочное → важное+не срочное → неважное+срочное → неважное+не срочное.
 */
export const DIRTY_GROUPS = [
  { key: 'important-urgent', important: true, urgent: true, title: 'ВАЖНОЕ + СРОЧНОЕ', tone: 'red' },
  { key: 'important-calm', important: true, urgent: false, title: 'ВАЖНОЕ + НЕ СРОЧНОЕ', tone: 'amber' },
  { key: 'normal-urgent', important: false, urgent: true, title: 'НЕВАЖНОЕ + СРОЧНОЕ', tone: 'green' },
  { key: 'normal-calm', important: false, urgent: false, title: 'НЕВАЖНОЕ + НЕ СРОЧНОЕ', tone: 'gray' },
] as const;

export type DirtyGroupKey = (typeof DIRTY_GROUPS)[number]['key'];
