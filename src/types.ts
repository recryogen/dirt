export type TaskType = 'practical' | 'lab';
export type Importance = 'important' | 'normal';
export type SubjectVisibility = 'public' | 'private';

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface Subject {
  id: string;
  category_id: string;
  name: string;
  visibility: SubjectVisibility;
  owner_nickname: string | null;
  owner_user_id: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  subject_id: string;
  number: number;
  title: string;
  type: TaskType;
  description: string;
  /** Дата в формате YYYY-MM-DD */
  deadline: string;
  importance: Importance;
  created_at: string;
}

export interface Completion {
  id: string;
  task_id: string;
  nickname: string;
  user_id: string | null;
  completed_at: string;
}

export interface AppData {
  categories: Category[];
  subjects: Subject[];
  tasks: Task[];
  completions: Completion[];
}

/** Поля задания, которые вводит пользователь в форме. */
export interface TaskInput {
  title: string;
  type: TaskType;
  description: string;
  deadline: string;
  importance: Importance;
}

export interface UserCalendar {
  user_id: string;
  filename: string;
  ics_text: string;
  updated_at: string;
}

export interface SharedNote {
  id: string;
  content: string;
  author_nickname: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CrosswordProgress {
  user_id: string;
  puzzle_date: string;
  cells: Record<string, string>;
  completed: boolean;
  updated_at: string;
}
