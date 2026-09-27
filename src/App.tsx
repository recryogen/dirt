import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Category from './components/Category';
import ConfirmDialog from './components/ConfirmDialog';
import DirtyList from './components/DirtyList';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import SubjectModal from './components/SubjectModal';
import TaskDetails from './components/TaskDetails';
import TaskModal from './components/TaskModal';
import Toast from './components/Toast';
import * as auth from './services/auth';
import * as api from './services/database';
import { isConfigured } from './services/supabaseClient';
import type { AppData, Subject, Task, TaskInput } from './types';
import { daysUntil } from './utils/deadline';
import { buildNumbering, normalizeNumbers, sortTasks } from './utils/numbering';
import { buildDirtyList } from './utils/sorting';

type Status = 'loading' | 'ready' | 'guest' | 'error' | 'unconfigured';

type ModalState =
  | null
  | { kind: 'subject'; categoryId: string; subject?: Subject }
  | { kind: 'task'; subjectId: string; task?: Task }
  | { kind: 'details'; taskId: string };

interface ConfirmState {
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
}

const ACTION_ERROR = 'Не удалось выполнить действие. Попробуйте ещё раз.';

export default function App() {
  const [status, setStatus] = useState<Status>(isConfigured ? 'loading' : 'unconfigured');
  const [data, setData] = useState<AppData | null>(null);
  const dataRef = useRef<AppData | null>(null);
  dataRef.current = data;
  const loadedRef = useRef(false);

  const [nickname, setNickname] = useState('');
  const [now, setNow] = useState(() => new Date());

  const [showDirty, setShowDirty] = useState(false);
  const [loginMode, setLoginMode] = useState<null | 'login' | 'register'>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /** Действие, которое нужно выполнить сразу после входа (например, «Я выполнил»). */
  const pendingRef = useRef<((nick: string) => void) | null>(null);

  // ───────────── Загрузка данных ─────────────

  const load = useCallback(async (): Promise<void> => {
    try {
      setData(await api.loadAll());
      loadedRef.current = true;
      setStatus('ready');
    } catch (e) {
      console.error(e);
      if (!loadedRef.current) setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isConfigured) return;
    void auth
      .restoreProfile()
      .then(async (profile) => {
        if (!profile) {
          setStatus('guest');
          return;
        }
        setNickname(profile.nickname);
        await load();
      })
      .catch((error) => {
        console.error(error);
        setStatus('error');
      });
  }, [load]);

  // Раз в минуту обновляем «сегодня» (чтобы дни пересчитались после полуночи);
  // при возврате на вкладку подтягиваем свежие данные других пользователей.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      setNow(new Date());
      if (isConfigured && loadedRef.current) void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  /** Выполняет изменение в базе и сразу обновляет интерфейс. */
  const run = useCallback(async (action: () => Promise<void>): Promise<boolean> => {
    try {
      await action();
      setData(await api.loadAll());
      return true;
    } catch (e) {
      console.error(e);
      setToast(ACTION_ERROR);
      return false;
    }
  }, []);

  // ───────────── Производные данные ─────────────

  const visibleData = useMemo<AppData | null>(() => {
    if (!data) return null;
    const me = nickname.trim().toLowerCase();
    const subjects = data.subjects.filter(
      (subject) =>
        subject.visibility !== 'private' ||
        (me !== '' && (subject.owner_nickname ?? '').trim().toLowerCase() === me),
    );
    const subjectIds = new Set(subjects.map((subject) => subject.id));
    const tasks = data.tasks.filter((task) => subjectIds.has(task.subject_id));
    const taskIds = new Set(tasks.map((task) => task.id));

    return {
      categories: data.categories,
      subjects,
      tasks,
      completions: data.completions.filter((completion) => taskIds.has(completion.task_id)),
    };
  }, [data, nickname]);

  const numbering = useMemo(() => buildNumbering(visibleData?.tasks ?? []), [visibleData]);

  const tasksBySubject = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of visibleData?.tasks ?? []) {
      const list = map.get(task.subject_id);
      if (list) list.push(task);
      else map.set(task.subject_id, [task]);
    }
    for (const [key, list] of map) map.set(key, sortTasks(list));
    return map;
  }, [visibleData]);

  const subjectsByCategory = useMemo(() => {
    const map = new Map<string, Subject[]>();
    for (const subject of visibleData?.subjects ?? []) {
      const list = map.get(subject.category_id);
      if (list) list.push(subject);
      else map.set(subject.category_id, [subject]);
    }
    return map;
  }, [visibleData]);

  const completionsByTask = useMemo(() => {
    const map = new Map<string, AppData['completions']>();
    for (const c of visibleData?.completions ?? []) {
      const list = map.get(c.task_id);
      if (list) list.push(c);
      else map.set(c.task_id, [c]);
    }
    return map;
  }, [visibleData]);

  const doneIds = useMemo(() => {
    const me = nickname.trim().toLowerCase();
    const set = new Set<string>();
    if (!me) return set;
    for (const c of visibleData?.completions ?? []) {
      if (c.nickname.trim().toLowerCase() === me) set.add(c.task_id);
    }
    return set;
  }, [visibleData, nickname]);

  const dirtyGroups = useMemo(
    () => (showDirty && visibleData && nickname ? buildDirtyList(visibleData, nickname, numbering, now) : []),
    [showDirty, visibleData, nickname, numbering, now],
  );

  // ───────────── Пользователь ─────────────

  const requireUser = (action: (nick: string) => void) => {
    if (nickname) {
      action(nickname);
    } else {
      pendingRef.current = action;
      setLoginMode('login');
    }
  };

  const handleAuth = async (nick: string, password: string) => {
    const profile = loginMode === 'register' ? await auth.register(nick, password) : await auth.login(nick, password);
    setNickname(profile.nickname);
    setLoginMode(null);
    setStatus('loading');
    await load();
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) pending(profile.nickname);
  };

  const closeLogin = () => {
    pendingRef.current = null;
    setLoginMode(null);
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      setNickname('');
      setData(null);
      loadedRef.current = false;
      setShowDirty(false);
      setModal(null);
      setStatus('guest');
    } catch (error) {
      console.error(error);
      setToast('Не удалось выйти. Попробуйте ещё раз.');
    }
  };

  const handleDirtyClick = () => {
    if (!nickname) {
      requireUser(() => setShowDirty(true));
      return;
    }
    if (!data) {
      setToast('Данные ещё не загружены.');
      return;
    }
    setShowDirty(true);
  };

  // ───────────── Дисциплины ─────────────

  const saveSubject = async (name: string) => {
    if (modal?.kind !== 'subject') return;
    const { categoryId, subject } = modal;
    const ok = await run(() => (subject ? api.renameSubject(subject.id, name) : api.createSubject(categoryId, name)));
    if (ok) setModal(null);
  };

  const askDeleteSubject = (subject: Subject) => {
    setConfirm({
      message: `Вы уверены, что хотите удалить дисциплину «${subject.name}»? Все её задания тоже будут удалены.`,
      onConfirm: async () => {
        await run(() => api.deleteSubject(subject.id));
        setConfirm(null);
      },
    });
  };

  const askToggleSubjectVisibility = (subject: Subject) => {
    requireUser((nick) => {
      const makePrivate = subject.visibility !== 'private';
      setConfirm({
        message: makePrivate
          ? `Сделать дисциплину «${subject.name}» личной? Она и все её задания будут видны только пользователю «${nick}».`
          : `Сделать дисциплину «${subject.name}» публичной? Она и все её задания станут видны всем пользователям.`,
        confirmLabel: makePrivate ? 'Сделать личной' : 'Сделать публичной',
        onConfirm: async () => {
          await run(() => api.setSubjectVisibility(subject.id, makePrivate ? 'private' : 'public', nick));
          setConfirm(null);
        },
      });
    });
  };

  // ───────────── Задания ─────────────

  const saveTask = async (input: TaskInput) => {
    if (modal?.kind !== 'task') return;
    const { subjectId, task } = modal;

    if (task) {
      const ok = await run(() => api.updateTask(task.id, input));
      if (ok) setModal({ kind: 'details', taskId: task.id });
      return;
    }

    const existing = tasksBySubject.get(subjectId) ?? [];
    const nextNumber = Math.max(existing.length, ...existing.map((t) => t.number)) + 1;
    const ok = await run(() => api.createTask(subjectId, nextNumber, input));
    if (ok) setModal(null);
  };

  const askDeleteTask = (task: Task) => {
    setConfirm({
      message: 'Вы уверены, что хотите удалить это задание?',
      onConfirm: async () => {
        const remaining = sortTasks((tasksBySubject.get(task.subject_id) ?? []).filter((t) => t.id !== task.id));
        const ok = await run(async () => {
          await api.deleteTask(task.id);
          // номера остальных заданий выравниваются: 1, 2, 3… без дыр
          const updates = normalizeNumbers(remaining);
          if (updates.length > 0) await api.saveNumbers(updates);
        });
        setConfirm(null);
        if (ok) setModal(null);
      },
    });
  };

  const moveTask = async (subjectId: string, taskId: string, direction: -1 | 1) => {
    const list = [...(tasksBySubject.get(subjectId) ?? [])];
    const index = list.findIndex((t) => t.id === taskId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    const updates = normalizeNumbers(list);
    if (updates.length === 0) return;
    await run(() => api.saveNumbers(updates));
  };

  const doToggleDone = async (taskId: string, nick: string) => {
    const me = nick.trim().toLowerCase();
    const existing = dataRef.current?.completions.find(
      (c) => c.task_id === taskId && c.nickname.trim().toLowerCase() === me,
    );
    await run(() => (existing ? api.unmarkCompleted(existing.id) : api.markCompleted(taskId, nick)));
  };

  const toggleDone = async (taskId: string) => {
    if (!nickname) {
      pendingRef.current = (nick) => void doToggleDone(taskId, nick);
      setLoginMode('login');
      return;
    }
    await doToggleDone(taskId, nickname);
  };

  // ───────────── Отрисовка ─────────────

  const detailsTask = modal?.kind === 'details' ? visibleData?.tasks.find((t) => t.id === modal.taskId) : undefined;
  const subjectName = (id: string) => visibleData?.subjects.find((s) => s.id === id)?.name ?? '';

  let content: ReactNode = null;
  if (status === 'unconfigured') {
    content = (
      <div className="notice">
        <h2 className="notice__title">Приложение ещё не подключено к базе данных</h2>
        <p>
          Создайте файл <code>.env</code> рядом с <code>package.json</code> и укажите в нём{' '}
          <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_ANON_KEY</code>. Подробная инструкция есть в README.md.
        </p>
      </div>
    );
  } else if (status === 'loading') {
    content = <div className="notice notice--plain">Загружаем данные…</div>;
  } else if (status === 'guest') {
    content = (
      <div className="notice auth-notice">
        <h2 className="notice__title">Требуется вход</h2>
        <p>Войдите под своим именем и паролем или создайте новый аккаунт.</p>
        <div className="form__actions">
          <button type="button" className="btn btn--primary" onClick={() => setLoginMode('login')}>
            Войти
          </button>
          <button type="button" className="btn btn--outline" onClick={() => setLoginMode('register')}>
            Регистрация
          </button>
        </div>
      </div>
    );
  } else if (status === 'error') {
    content = (
      <div className="notice">
        <h2 className="notice__title">Не удалось загрузить данные.</h2>
        <p>Попробуйте обновить страницу.</p>
        <div className="form__actions">
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            Обновить страницу
          </button>
        </div>
      </div>
    );
  } else if (data && data.categories.length === 0) {
    content = (
      <div className="notice">
        <h2 className="notice__title">Здесь пока пусто</h2>
        <p>Создайте две основные категории — «Чето серьезное» и «Хуйня», а затем добавляйте в них дисциплины.</p>
        <div className="form__actions">
          <button type="button" className="btn btn--success" onClick={() => void run(api.ensureDefaultCategories)}>
            Создать категории
          </button>
        </div>
      </div>
    );
  } else if (data) {
    const categoryViews = data.categories.map((category) => (
      <Category
        key={category.id}
        category={category}
        subjects={subjectsByCategory.get(category.id) ?? []}
        tasksBySubject={tasksBySubject}
        numbering={numbering}
        doneIds={doneIds}
        today={now}
        onAddSubject={() => setModal({ kind: 'subject', categoryId: category.id })}
        onAddTask={(subject) => setModal({ kind: 'task', subjectId: subject.id })}
        onRenameSubject={(subject) => setModal({ kind: 'subject', categoryId: category.id, subject })}
        onDeleteSubject={askDeleteSubject}
        onToggleSubjectVisibility={askToggleSubjectVisibility}
        onOpenTask={(taskId) => setModal({ kind: 'details', taskId })}
        onMoveTask={(subjectId, taskId, dir) => void moveTask(subjectId, taskId, dir)}
      />
    ));

    content = (
      <div className="workspace-layout">
        <aside className="workspace-layout__side workspace-layout__side--left">{categoryViews[0]}</aside>
        <DirtyList
          nickname={nickname}
          groups={dirtyGroups}
          revealed={showDirty}
          onOpenTask={(taskId) => setModal({ kind: 'details', taskId })}
        />
        <aside className="workspace-layout__side workspace-layout__side--right">{categoryViews[1]}</aside>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        nickname={nickname}
        onLoginClick={() => setLoginMode('login')}
        onLogout={() => void handleLogout()}
        onDirtyClick={handleDirtyClick}
      />

      <main className="main">{content}</main>

      {modal?.kind === 'subject' && (
        <SubjectModal initialName={modal.subject?.name} onSubmit={saveSubject} onClose={() => setModal(null)} />
      )}

      {modal?.kind === 'task' && (
        <TaskModal
          subjectName={subjectName(modal.subjectId)}
          task={modal.task}
          onSubmit={saveTask}
          onClose={() => setModal(modal.task ? { kind: 'details', taskId: modal.task.id } : null)}
        />
      )}

      {modal?.kind === 'details' && detailsTask && (
        <TaskDetails
          task={detailsTask}
          subjectName={subjectName(detailsTask.subject_id)}
          number={numbering.get(detailsTask.id) ?? detailsTask.number}
          daysLeft={daysUntil(detailsTask.deadline, now)}
          completions={completionsByTask.get(detailsTask.id) ?? []}
          nickname={nickname}
          onToggleDone={() => toggleDone(detailsTask.id)}
          onEdit={() => setModal({ kind: 'task', subjectId: detailsTask.subject_id, task: detailsTask })}
          onDelete={() => askDeleteTask(detailsTask)}
          onClose={() => setModal(null)}
        />
      )}

      {loginMode && (
        <LoginModal
          key={loginMode}
          mode={loginMode}
          onSubmit={handleAuth}
          onSwitchMode={() => setLoginMode((mode) => (mode === 'login' ? 'register' : 'login'))}
          onClose={closeLogin}
        />
      )}

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
