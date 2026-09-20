import { URGENT_DAYS } from '../config';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Сколько дней осталось до дедлайна относительно сегодняшней даты.
 *  -5 → дедлайн был 5 дней назад,  0 → сегодня,  1 → завтра.
 *
 * Считаем по календарным датам (UTC-полночь), а не по миллисекундам
 * «сейчас», поэтому время суток и переход на летнее время ничего не ломают.
 */
export function daysUntil(deadline: string, today: Date = new Date()): number {
  const [y, m, d] = deadline.split('-').map(Number);
  const target = Date.UTC(y, m - 1, d);
  const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - current) / MS_PER_DAY);
}

/** Срочное = осталось URGENT_DAYS дней или меньше (в том числе просроченное). */
export function isUrgent(daysLeft: number): boolean {
  return daysLeft <= URGENT_DAYS;
}

/** Склонение слова «день» по модулю числа: 1 день, 2 дня, 5 дней, 11 дней. */
export function pluralDays(n: number): string {
  const abs = Math.abs(n);
  const lastTwo = abs % 100;
  const last = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return 'дней';
  if (last === 1) return 'день';
  if (last >= 2 && last <= 4) return 'дня';
  return 'дней';
}

/** «-2 дня», «-1 день», «0 дней», «1 день», «5 дней». */
export function formatDaysLeft(daysLeft: number): string {
  return `${daysLeft} ${pluralDays(daysLeft)}`;
}

/** YYYY-MM-DD → DD.MM.YYYY */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** Сегодняшняя дата в формате YYYY-MM-DD (для значения по умолчанию в форме). */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** CSS-модификатор для плашки с оставшимися днями. */
export function deadlineTone(daysLeft: number): 'overdue' | 'urgent' | 'calm' {
  if (daysLeft < 0) return 'overdue';
  if (isUrgent(daysLeft)) return 'urgent';
  return 'calm';
}
