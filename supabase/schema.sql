-- =====================================================================
--  «Сделать грязь» — схема базы данных для Supabase
--  Выполните этот файл целиком в Supabase → SQL Editor → New query → Run.
--  Скрипт можно запускать повторно: он ничего не ломает и не дублирует.
-- =====================================================================

-- ---------- Таблицы ----------

-- Пользователи: только ник, без паролей и регистрации.
create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  nickname   text not null unique
             check (char_length(btrim(nickname)) between 1 and 40),
  created_at timestamptz not null default now()
);

-- Категории («Чето серьезное» и «Хуйня»).
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order integer not null default 0
);

-- Дисциплины.
create table if not exists public.subjects (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name        text not null check (char_length(btrim(name)) > 0),
  created_at  timestamptz not null default now()
);

-- Задания. number — порядковый номер внутри дисциплины (присваивается приложением).
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  number      integer not null default 0,
  title       text not null check (char_length(btrim(title)) > 0),
  type        text not null check (type in ('practical', 'lab')),
  description text not null default '',
  deadline    date not null,
  importance  text not null check (importance in ('important', 'normal')),
  created_at  timestamptz not null default now()
);

-- Кто выполнил задание.
create table if not exists public.task_completions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks(id) on delete cascade,
  nickname     text not null check (char_length(btrim(nickname)) between 1 and 40),
  completed_at timestamptz not null default now()
);

-- Один ник может отметить задание только один раз (без учёта регистра).
create unique index if not exists task_completions_task_nick_uq
  on public.task_completions (task_id, lower(nickname));

create index if not exists subjects_category_idx on public.subjects (category_id);
create index if not exists tasks_subject_idx     on public.tasks (subject_id);
create index if not exists completions_task_idx  on public.task_completions (task_id);

-- ---------- Начальные данные ----------

insert into public.categories (name, sort_order) values
  ('Чето серьезное', 1),
  ('Хуйня', 2)
on conflict (name) do nothing;

-- ---------- Права доступа (Row Level Security) ----------
-- В приложении нет авторизации, поэтому анонимному ключу разрешены
-- чтение и запись. Любой, у кого есть ссылка на сайт, может менять данные.
-- Используйте это для закрытой группы (одногруппники).

alter table public.users            enable row level security;
alter table public.categories       enable row level security;
alter table public.subjects         enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_completions enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['users', 'categories', 'subjects', 'tasks', 'task_completions']
  loop
    execute format('drop policy if exists "public_all" on public.%I', t);
    execute format(
      'create policy "public_all" on public.%I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
