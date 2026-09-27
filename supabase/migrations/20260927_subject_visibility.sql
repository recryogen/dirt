-- Добавляет личные и публичные дисциплины в уже работающую базу.
-- Выполните файл один раз в Supabase -> SQL Editor -> New query -> Run.

begin;

alter table public.subjects
  add column if not exists visibility text not null default 'public';

alter table public.subjects
  add column if not exists owner_nickname text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subjects_visibility_check' and conrelid = 'public.subjects'::regclass
  ) then
    alter table public.subjects
      add constraint subjects_visibility_check
      check (visibility in ('public', 'private'));
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

create index if not exists subjects_owner_idx
  on public.subjects (lower(owner_nickname));

commit;
