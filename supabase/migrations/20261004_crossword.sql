-- Личный прогресс ежедневного инженерного кроссворда.
-- Выполните файл целиком в Supabase -> SQL Editor.

begin;

create table if not exists public.crossword_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  puzzle_date date not null,
  cells jsonb not null default '{}'::jsonb,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, puzzle_date)
);

alter table public.crossword_progress enable row level security;
drop policy if exists "crossword_progress_self" on public.crossword_progress;
create policy "crossword_progress_self" on public.crossword_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.crossword_progress from anon;
grant select, insert, update, delete on public.crossword_progress to authenticated;

commit;
