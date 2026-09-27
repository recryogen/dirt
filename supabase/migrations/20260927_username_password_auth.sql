-- Включает регистрацию и вход по нику + паролю через Supabase Auth.
-- Файл совместим как с исходной базой, так и с версией личных дисциплин.
-- Выполните целиком в Supabase -> SQL Editor -> New query -> Run.

begin;

alter table public.users
  add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;

alter table public.subjects
  add column if not exists visibility text not null default 'public',
  add column if not exists owner_nickname text,
  add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;

alter table public.task_completions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subjects_visibility_check' and conrelid = 'public.subjects'::regclass
  ) then
    alter table public.subjects add constraint subjects_visibility_check
      check (visibility in ('public', 'private'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'subjects_owner_nickname_fkey' and conrelid = 'public.subjects'::regclass
  ) then
    alter table public.subjects add constraint subjects_owner_nickname_fkey
      foreign key (owner_nickname) references public.users(nickname)
      on update cascade on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'subjects_visibility_owner_check' and conrelid = 'public.subjects'::regclass
  ) then
    alter table public.subjects add constraint subjects_visibility_owner_check check (
      (visibility = 'public' and owner_nickname is null) or
      (visibility = 'private' and owner_nickname is not null)
    );
  end if;
end $$;

create unique index if not exists users_auth_user_uq
  on public.users (auth_user_id) where auth_user_id is not null;
create unique index if not exists task_completions_task_user_uq
  on public.task_completions (task_id, user_id) where user_id is not null;
create index if not exists subjects_owner_user_idx on public.subjects (owner_user_id);

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
  if v_uid is null then raise exception 'Authentication required'; end if;
  if char_length(v_nickname) not between 1 and 40 then raise exception 'Invalid nickname'; end if;

  select * into v_profile from public.users where auth_user_id = v_uid;
  if not found then
    select * into v_profile from public.users
    where lower(nickname) = lower(v_nickname)
    order by created_at limit 1 for update;

    if found then
      if v_profile.auth_user_id is not null and v_profile.auth_user_id <> v_uid then
        raise exception 'Username is already taken';
      end if;
      update public.users set auth_user_id = v_uid
      where id = v_profile.id returning * into v_profile;
    else
      insert into public.users (auth_user_id, nickname)
      values (v_uid, v_nickname) returning * into v_profile;
    end if;
  end if;

  update public.subjects set owner_user_id = v_uid
  where owner_user_id is null and owner_nickname is not null
    and lower(owner_nickname) = lower(v_profile.nickname);

  update public.task_completions set user_id = v_uid
  where user_id is null and lower(nickname) = lower(v_profile.nickname);

  return v_profile;
end;
$$;

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.subjects enable row level security;
alter table public.tasks enable row level security;
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
  with check ((visibility = 'public' and owner_user_id is null) or
              (visibility = 'private' and owner_user_id = auth.uid()));

drop policy if exists "subjects_update" on public.subjects;
create policy "subjects_update" on public.subjects for update to authenticated
  using (visibility = 'public' or owner_user_id = auth.uid())
  with check ((visibility = 'public' and owner_user_id is null) or
              (visibility = 'private' and owner_user_id = auth.uid()));

drop policy if exists "subjects_delete" on public.subjects;
create policy "subjects_delete" on public.subjects for delete to authenticated
  using (visibility = 'public' or owner_user_id = auth.uid());

drop policy if exists "tasks_read_visible" on public.tasks;
create policy "tasks_read_visible" on public.tasks for select to authenticated
  using (exists (select 1 from public.subjects s where s.id = subject_id
    and (s.visibility = 'public' or s.owner_user_id = auth.uid())));

drop policy if exists "tasks_insert" on public.tasks;
create policy "tasks_insert" on public.tasks for insert to authenticated
  with check (exists (select 1 from public.subjects s where s.id = subject_id
    and (s.visibility = 'public' or s.owner_user_id = auth.uid())));

drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update" on public.tasks for update to authenticated
  using (exists (select 1 from public.subjects s where s.id = subject_id
    and (s.visibility = 'public' or s.owner_user_id = auth.uid())))
  with check (exists (select 1 from public.subjects s where s.id = subject_id
    and (s.visibility = 'public' or s.owner_user_id = auth.uid())));

drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks for delete to authenticated
  using (exists (select 1 from public.subjects s where s.id = subject_id
    and (s.visibility = 'public' or s.owner_user_id = auth.uid())));

drop policy if exists "completions_read_visible" on public.task_completions;
create policy "completions_read_visible" on public.task_completions for select to authenticated
  using (exists (select 1 from public.tasks t join public.subjects s on s.id = t.subject_id
    where t.id = task_id and (s.visibility = 'public' or s.owner_user_id = auth.uid())));

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

commit;
