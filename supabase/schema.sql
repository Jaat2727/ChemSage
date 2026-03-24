create extension if not exists pgcrypto;

create table if not exists public.registered_rollnos (
  roll_no text primary key,
  name text not null,
  programme text not null check (programme in ('BS', 'MSc', 'PhD')),
  batch_year int not null,
  imported_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  roll_no text unique not null,
  name text not null,
  programme text not null,
  batch_year int not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'banned')),
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id text primary key,
  name text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id text references public.rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_anon boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('Notes', 'Lab Reports', 'Assignments', 'References')),
  file_url text not null,
  file_type text,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  room_id text references public.rooms(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_papers (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  exam_type text not null check (exam_type in ('End Sem', 'Mid Sem', 'Quiz', 'Lab Exam')),
  year int not null,
  semester text not null,
  file_url text not null,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  type text not null check (type in ('Lecture', 'Lab', 'Tutorial')),
  room_no text not null,
  day_of_week text not null,
  start_time time not null,
  end_time time not null
);

insert into public.rooms (id, name, description, created_by, is_public)
values ('global', 'Global Hub', 'Portal-wide discussion room for all active students.', null, true)
on conflict (id) do nothing;

alter table public.registered_rollnos enable row level security;
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.resources enable row level security;
alter table public.exam_papers enable row level security;
alter table public.schedule enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  );
$$;

create policy "profiles select access" on public.profiles
for select using (
  id = auth.uid() 
  or public.is_active_user() 
  or public.is_admin()
);

create policy "profiles self update" on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (
  id = auth.uid()
  or public.is_admin()
);

create policy "profiles insert self" on public.profiles
for insert with check (id = auth.uid());

create policy "registered_rollnos read auth" on public.registered_rollnos
for select using (auth.role() = 'authenticated');

create policy "registered_rollnos admin write" on public.registered_rollnos
for all using (public.is_admin()) with check (public.is_admin());

create policy "rooms active select public" on public.rooms
for select using (public.is_active_user() and is_public = true);

create policy "rooms active create" on public.rooms
for insert with check (public.is_active_user() and created_by = auth.uid());

create policy "rooms owner or admin update" on public.rooms
for update using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

create policy "rooms owner or admin delete" on public.rooms
for delete using (created_by = auth.uid() or public.is_admin());

create policy "room_members see joined rooms" on public.room_members
for select using (
  public.is_active_user()
);

create policy "room_members self join" on public.room_members
for insert with check (public.is_active_user() and user_id = auth.uid());

create policy "room_members admin delete" on public.room_members
for delete using (public.is_admin() or user_id = auth.uid());

create policy "messages read joined rooms" on public.messages
for select using (
  public.is_active_user()
  and (messages.room_id = 'global' or exists (
    select 1 from public.room_members rm
    where rm.room_id = messages.room_id and rm.user_id = auth.uid()
  ))
);

create policy "messages insert own" on public.messages
for insert with check (
  public.is_active_user()
  and sender_id = auth.uid()
  and (messages.room_id = 'global' or exists (
    select 1 from public.room_members rm
    where rm.room_id = messages.room_id and rm.user_id = auth.uid()
  ))
);

create policy "resources active read" on public.resources
for select using (public.is_active_user());

create policy "resources admin write" on public.resources
for all using (public.is_admin()) with check (public.is_admin());

create policy "exam_papers active read" on public.exam_papers
for select using (public.is_active_user());

create policy "exam_papers admin write" on public.exam_papers
for all using (public.is_admin()) with check (public.is_admin());

create policy "schedule own CRUD" on public.schedule
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Enable realtime for messages
alter publication supabase_realtime add table messages;

-- Set up cron job to delete old synergy group messages
create extension if not exists pg_cron;

select cron.schedule(
  'delete-old-messages',
  '0 * * * *',
  $$ delete from public.messages where room_id != 'global' and created_at < now() - interval '1 day'; $$
);
