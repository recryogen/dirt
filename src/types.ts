export type TaskType = 'practical' | 'lab';
export type Importance = 'important' | 'normal';

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface Subject {
  id: string;
  category_id: string;
  name: string;
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
