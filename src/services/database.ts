import { DEFAULT_CATEGORIES } from '../config';
import type { AppData, Category, Completion, Subject, SubjectVisibility, Task, TaskInput } from '../types';
import { supabase } from './supabaseClient';

/**
 * Единственное место, которое общается с Supabase.
 * Все функции бросают исключение при ошибке — интерфейс ловит его
 * и показывает пользователю понятное сообщение (технические детали
 * уходят только в console).
 */

function db() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function check(error: { message: string } | null): void {
  if (error) throw error;
}

// ───────────── Чтение ─────────────

export async function loadAll(): Promise<AppData> {
  const client = db();
  const [categories, subjects, tasks, completions] = await Promise.all([
    client.from('categories').select('*').order('sort_order').order('name'),
    client.from('subjects').select('*').order('created_at'),
    client.from('tasks').select('*').order('number').order('created_at'),
    client.from('task_completions').select('*').order('completed_at'),
  ]);
  check(categories.error);
  check(subjects.error);
  check(tasks.error);
  check(completions.error);
  return {
    categories: (categories.data ?? []) as Category[],
    subjects: (subjects.data ?? []) as Subject[],
    tasks: (tasks.data ?? []) as Task[],
    completions: (completions.data ?? []) as Completion[],
  };
}

// ───────────── Категории ─────────────

/** Создаёт «Чето серьезное» и «Хуйня», если их ещё нет (для пустой базы). */
export async function ensureDefaultCategories(): Promise<void> {
  const { error } = await db()
    .from('categories')
    .upsert(DEFAULT_CATEGORIES, { onConflict: 'name', ignoreDuplicates: true });
  check(error);
}

// ───────────── Дисциплины ─────────────

export async function createSubject(categoryId: string, name: string): Promise<void> {
  const { error } = await db().from('subjects').insert({ category_id: categoryId, name });
  check(error);
}

export async function renameSubject(id: string, name: string): Promise<void> {
  const { error } = await db().from('subjects').update({ name }).eq('id', id);
  check(error);
}

export async function deleteSubject(id: string): Promise<void> {
  // задания и отметки удаляются каскадно (on delete cascade)
  const { error } = await db().from('subjects').delete().eq('id', id);
  check(error);
}

/** Меняет видимость дисциплины. Личная дисциплина привязывается к нику владельца. */
export async function setSubjectVisibility(
  id: string,
  visibility: SubjectVisibility,
  nickname: string,
): Promise<void> {
  const { data: authData, error: authError } = await db().auth.getUser();
  check(authError);
  if (!authData.user) throw new Error('Authentication required');

  const { error } = await db()
    .from('subjects')
    .update({
      visibility,
      owner_nickname: visibility === 'private' ? nickname : null,
      owner_user_id: visibility === 'private' ? authData.user.id : null,
    })
    .eq('id', id);
  check(error);
}

// ───────────── Задания ─────────────

export async function createTask(subjectId: string, number: number, input: TaskInput): Promise<void> {
  const { error } = await db().from('tasks').insert({ subject_id: subjectId, number, ...input });
  check(error);
}

export async function updateTask(id: string, input: TaskInput): Promise<void> {
  const { error } = await db().from('tasks').update(input).eq('id', id);
  check(error);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await db().from('tasks').delete().eq('id', id);
  check(error);
}

/** Записывает новые порядковые номера (после удаления или перестановки). */
export async function saveNumbers(updates: { id: string; number: number }[]): Promise<void> {
  const results = await Promise.all(
    updates.map((u) => db().from('tasks').update({ number: u.number }).eq('id', u.id)),
  );
  for (const r of results) check(r.error);
}

// ───────────── Отметки о выполнении ─────────────

export async function markCompleted(taskId: string, nickname: string): Promise<void> {
  const { data: authData, error: authError } = await db().auth.getUser();
  check(authError);
  if (!authData.user) throw new Error('Authentication required');
  const { error } = await db()
    .from('task_completions')
    .insert({ task_id: taskId, nickname, user_id: authData.user.id });
  // 23505 = отметка уже есть (например, нажали с двух устройств) — это не ошибка
  if (error && (error as { code?: string }).code !== '23505') throw error;
}

export async function unmarkCompleted(completionId: string): Promise<void> {
  const { error } = await db().from('task_completions').delete().eq('id', completionId);
  check(error);
}
