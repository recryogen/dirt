-- =====================================================================
--  «Сделать грязь» — схема базы данных для Supabase
--  Выполните этот файл целиком в Supabase → SQL Editor → New query → Run.
--  Скрипт можно запускать повторно: он ничего не ломает и не дублирует.
-- =====================================================================

-- ---------- Таблицы ----------

-- Публичные профили пользователей. Пароли находятся только в Supabase Auth.
create table if not exists public.users (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  nickname     text not null unique
               check (char_length(btrim(nickname)) between 1 and 40),
  created_at   timestamptz not null default now()
);

alter table public.users
  add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists users_auth_user_uq on public.users (auth_user_id) where auth_user_id is not null;

-- Категории («Чето серьезное» и «Хуйня»).
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order integer not null default 0
);

-- Дисциплины.
create table if not exists public.subjects (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid not null references public.categories(id) on delete cascade,
  name           text not null check (char_length(btrim(name)) > 0),
  visibility     text not null default 'public' check (visibility in ('public', 'private')),
  owner_nickname text references public.users(nickname) on update cascade on delete restrict,
  owner_user_id  uuid references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  constraint subjects_visibility_owner_check check (
    (visibility = 'public' and owner_nickname is null) or
    (visibility = 'private' and owner_nickname is not null)
  )
);

-- Обновление уже существующей базы: старые дисциплины остаются публичными.
alter table public.subjects add column if not exists visibility text not null default 'public';
alter table public.subjects add column if not exists owner_nickname text;
alter table public.subjects add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subjects_visibility_check' and conrelid = 'public.subjects'::regclass
  ) then
    alter table public.subjects
      add constraint subjects_visibility_check check (visibility in ('public', 'private'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'subjects_owner_nickname_fkey' and conrelid = 'public.subjects'::regclass
  ) then
    alter table public.subjects
      add constraint subjects_owner_nickname_fkey
      foreign key (owner_nickname) references public.users(nickname)
      on update cascade on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'subjects_visibility_owner_check' and conrelid = 'public.subjects'::regclass
  ) then
    alter table public.subjects
      add constraint subjects_visibility_owner_check check (
        (visibility = 'public' and owner_nickname is null) or
        (visibility = 'private' and owner_nickname is not null)
      );
  end if;
end $$;

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
  user_id      uuid references auth.users(id) on delete cascade,
  nickname     text not null check (char_length(btrim(nickname)) between 1 and 40),
  completed_at timestamptz not null default now()
);

alter table public.task_completions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Один ник может отметить задание только один раз (без учёта регистра).
create unique index if not exists task_completions_task_nick_uq
  on public.task_completions (task_id, lower(nickname));

create unique index if not exists task_completions_task_user_uq
  on public.task_completions (task_id, user_id) where user_id is not null;

create index if not exists subjects_category_idx on public.subjects (category_id);
create index if not exists subjects_owner_idx on public.subjects (lower(owner_nickname));
create index if not exists subjects_owner_user_idx on public.subjects (owner_user_id);
create index if not exists tasks_subject_idx     on public.tasks (subject_id);
create index if not exists completions_task_idx  on public.task_completions (task_id);

-- Создаёт/возвращает профиль текущего пользователя Auth и привязывает
-- старые данные с тем же ником. Пароль хранится только в Supabase Auth.
create or replace function public.claim_profile()
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_nickname text := btrim(coalesce(auth.jwt() -> 'user_metadata' ->> 'nickname', ''));
  v_profile public.users;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;
  if char_length(v_nickname) not between 1 and 40 then
    raise exception 'Invalid nickname';
  end if;

  select * into v_profile from public.users where auth_user_id = v_uid;
  if not found then
    select * into v_profile
    from public.users
    where lower(nickname) = lower(v_nickname)
    order by created_at
    limit 1
    for update;

    if found then
      if v_profile.auth_user_id is not null and v_profile.auth_user_id <> v_uid then
        raise exception 'Username is already taken';
      end if;
      update public.users set auth_user_id = v_uid where id = v_profile.id returning * into v_profile;
    else
      insert into public.users (auth_user_id, nickname)
      values (v_uid, v_nickname)
      returning * into v_profile;
    end if;
  end if;

  update public.subjects
  set owner_user_id = v_uid
  where owner_user_id is null
    and owner_nickname is not null
    and lower(owner_nickname) = lower(v_profile.nickname);

  update public.task_completions
  set user_id = v_uid
  where user_id is null and lower(nickname) = lower(v_profile.nickname);

  return v_profile;
end;
$$;

-- ---------- Начальные данные ----------

insert into public.categories (name, sort_order) values
  ('Чето серьезное', 1),
  ('Хуйня', 2)
on conflict (name) do nothing;

-- ---------- Права доступа (Row Level Security) ----------
-- Доступ выдаётся только вошедшим пользователям. Личные дисциплины и их
-- задания защищены на уровне БД через auth.uid().

alter table public.users            enable row level security;
alter table public.categories       enable row level security;
alter table public.subjects         enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_completions enable row level security;

drop policy if exists "public_all" on public.users;
drop policy if exists "public_all" on public.categories;
drop policy if exists "public_all" on public.subjects;
drop policy if exists "public_all" on public.tasks;
drop policy if exists "public_all" on public.task_completions;

drop policy if exists "users_self" on public.users;
create policy "users_self" on public.users for select to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "categories_authenticated" on public.categories;
create policy "categories_authenticated" on public.categories for all to authenticated
  using (true) with check (true);

drop policy if exists "subjects_read_visible" on public.subjects;
create policy "subjects_read_visible" on public.subjects for select to authenticated
  using (visibility = 'public' or owner_user_id = auth.uid());

drop policy if exists "subjects_insert" on public.subjects;
create policy "subjects_insert" on public.subjects for insert to authenticated
  with check (
    (visibility = 'public' and owner_user_id is null) or
    (visibility = 'private' and owner_user_id = auth.uid())
  );

drop policy if exists "subjects_update" on public.subjects;
create policy "subjects_update" on public.subjects for update to authenticated
  using (visibility = 'public' or owner_user_id = auth.uid())
  with check (
    (visibility = 'public' and owner_user_id is null) or
    (visibility = 'private' and owner_user_id = auth.uid())
  );

drop policy if exists "subjects_delete" on public.subjects;
create policy "subjects_delete" on public.subjects for delete to authenticated
  using (visibility = 'public' or owner_user_id = auth.uid());

drop policy if exists "tasks_read_visible" on public.tasks;
create policy "tasks_read_visible" on public.tasks for select to authenticated
  using (exists (
    select 1 from public.subjects s
    where s.id = subject_id and (s.visibility = 'public' or s.owner_user_id = auth.uid())
  ));

drop policy if exists "tasks_insert" on public.tasks;
create policy "tasks_insert" on public.tasks for insert to authenticated
  with check (exists (
    select 1 from public.subjects s
    where s.id = subject_id and (s.visibility = 'public' or s.owner_user_id = auth.uid())
  ));

drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update" on public.tasks for update to authenticated
  using (exists (
    select 1 from public.subjects s
    where s.id = subject_id and (s.visibility = 'public' or s.owner_user_id = auth.uid())
  ))
  with check (exists (
    select 1 from public.subjects s
    where s.id = subject_id and (s.visibility = 'public' or s.owner_user_id = auth.uid())
  ));

drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks for delete to authenticated
  using (exists (
    select 1 from public.subjects s
    where s.id = subject_id and (s.visibility = 'public' or s.owner_user_id = auth.uid())
  ));

drop policy if exists "completions_read_visible" on public.task_completions;
create policy "completions_read_visible" on public.task_completions for select to authenticated
  using (exists (
    select 1 from public.tasks t join public.subjects s on s.id = t.subject_id
    where t.id = task_id and (s.visibility = 'public' or s.owner_user_id = auth.uid())
  ));

drop policy if exists "completions_insert_self" on public.task_completions;
create policy "completions_insert_self" on public.task_completions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "completions_delete_self" on public.task_completions;
create policy "completions_delete_self" on public.task_completions for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.users, public.categories, public.subjects, public.tasks, public.task_completions from anon;
grant usage on schema public to authenticated;
grant select on public.users to authenticated;
grant select, insert, update, delete on public.categories, public.subjects, public.tasks, public.task_completions to authenticated;
revoke all on function public.claim_profile() from public, anon;
grant execute on function public.claim_profile() to authenticated;
