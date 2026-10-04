import { DEFAULT_CATEGORIES } from '../config';
import type { AppData, Category, Completion, CrosswordProgress, SharedNote, Subject, SubjectVisibility, Task, TaskInput, UserCalendar } from '../types';
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

// ───────────── Личное расписание ─────────────

export async function loadCalendar(): Promise<UserCalendar | null> {
  const { data, error } = await db().from('user_calendars').select('*').maybeSingle();
  check(error);
  return (data as UserCalendar | null) ?? null;
}

export async function saveCalendar(filename: string, icsText: string): Promise<void> {
  const { data: authData, error: authError } = await db().auth.getUser();
  check(authError);
  if (!authData.user) throw new Error('Authentication required');
  const { error } = await db().from('user_calendars').upsert({
    user_id: authData.user.id,
    filename,
    ics_text: icsText,
    updated_at: new Date().toISOString(),
  });
  check(error);
}

export async function deleteCalendar(): Promise<void> {
  const { data: authData, error: authError } = await db().auth.getUser();
  check(authError);
  if (!authData.user) throw new Error('Authentication required');
  const { error } = await db().from('user_calendars').delete().eq('user_id', authData.user.id);
  check(error);
}

// ───────────── Общие заметки ─────────────

export async function loadNotes(): Promise<SharedNote[]> {
  const { data, error } = await db().from('shared_notes').select('*').order('updated_at', { ascending: false });
  check(error);
  return (data ?? []) as SharedNote[];
}

export async function createNote(content: string, nickname: string): Promise<void> {
  const { data: authData, error: authError } = await db().auth.getUser();
  check(authError);
  if (!authData.user) throw new Error('Authentication required');
  const { error } = await db().from('shared_notes').insert({
    content,
    author_nickname: nickname,
    created_by: authData.user.id,
  });
  check(error);
}

export async function updateNote(id: string, content: string): Promise<void> {
  const { error } = await db().from('shared_notes').update({ content, updated_at: new Date().toISOString() }).eq('id', id);
  check(error);
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await db().from('shared_notes').delete().eq('id', id);
  check(error);
}

// ───────────── Анекдот дня ─────────────

export async function loadDailyJoke(): Promise<string> {
  const { data, error } = await db().functions.invoke('daily-joke');
  check(error);
  if (!data?.text || typeof data.text !== 'string') throw new Error('Joke is unavailable');
  return data.text;
}

// ───────────── Личный прогресс кроссворда ─────────────

export async function loadCrosswordProgress(puzzleDate: string): Promise<CrosswordProgress | null> {
  const { data, error } = await db().from('crossword_progress').select('*').eq('puzzle_date', puzzleDate).maybeSingle();
  check(error);
  return (data as CrosswordProgress | null) ?? null;
}

export async function saveCrosswordProgress(puzzleDate: string, cells: Record<string, string>, completed: boolean): Promise<void> {
  const { data: authData, error: authError } = await db().auth.getUser();
  check(authError);
  if (!authData.user) throw new Error('Authentication required');
  const { error } = await db().from('crossword_progress').upsert({
    user_id: authData.user.id,
    puzzle_date: puzzleDate,
    cells,
    completed,
    updated_at: new Date().toISOString(),
  });
  check(error);
}
