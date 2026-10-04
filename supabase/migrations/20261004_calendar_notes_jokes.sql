-- Личное расписание, общие заметки и кэш анекдота дня.
-- Выполните файл целиком в Supabase -> SQL Editor.

begin;

create table if not exists public.user_calendars (
  user_id uuid primary key references auth.users(id) on delete cascade,
  filename text not null check (char_length(filename) between 1 and 255),
  ics_text text not null check (char_length(ics_text) between 1 and 2000000),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_notes (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  author_nickname text not null check (char_length(author_nickname) between 1 and 40),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_jokes (
  joke_date date primary key,
  text text not null,
  source_url text not null default 'https://www.anekdot.ru/',
  created_at timestamptz not null default now()
);

alter table public.user_calendars enable row level security;
alter table public.shared_notes enable row level security;
alter table public.daily_jokes enable row level security;

drop policy if exists "calendar_self" on public.user_calendars;
create policy "calendar_self" on public.user_calendars for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notes_read_authenticated" on public.shared_notes;
create policy "notes_read_authenticated" on public.shared_notes for select to authenticated using (true);
drop policy if exists "notes_insert_authenticated" on public.shared_notes;
create policy "notes_insert_authenticated" on public.shared_notes for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "notes_update_authenticated" on public.shared_notes;
create policy "notes_update_authenticated" on public.shared_notes for update to authenticated using (true) with check (true);
drop policy if exists "notes_delete_authenticated" on public.shared_notes;
create policy "notes_delete_authenticated" on public.shared_notes for delete to authenticated using (true);

drop policy if exists "jokes_read_authenticated" on public.daily_jokes;
create policy "jokes_read_authenticated" on public.daily_jokes for select to authenticated using (true);

revoke all on public.user_calendars, public.shared_notes, public.daily_jokes from anon;
grant select, insert, update, delete on public.user_calendars, public.shared_notes to authenticated;
grant select on public.daily_jokes to authenticated;

commit;
