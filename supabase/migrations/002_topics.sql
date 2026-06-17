-- 002_topics.sql
-- Debate topics

create table if not exists public.topics (
id uuid primary key default gen_random_uuid(),
title text not null,
description text not null,
status text not null default 'draft',
starts_at timestamp with time zone,
ends_at timestamp with time zone,
created_by uuid references public.profiles(id) on delete set null,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
deleted_at timestamp with time zone,
deleted_by uuid references auth.users(id) on delete set null,
athena_position text,
poseidon_position text,

constraint topics_status_check
check (
status = any (
array[
'draft'::text,
'open'::text,
'active'::text,
'closed'::text,
'archived'::text
]
)
)
);

alter table public.topics enable row level security;

create index if not exists topics_status_idx
on public.topics using btree (status);

create index if not exists topics_created_at_idx
on public.topics using btree (created_at desc);

create index if not exists topics_deleted_at_idx
on public.topics using btree (deleted_at);

drop trigger if exists set_topics_updated_at on public.topics;

create trigger set_topics_updated_at
before update on public.topics
for each row
execute function public.set_updated_at();

drop policy if exists "Anyone can read public topics" on public.topics;
drop policy if exists "public can read topics" on public.topics;
drop policy if exists "Admins can read all topics" on public.topics;
drop policy if exists "Admins can create topics" on public.topics;
drop policy if exists "Admins can update topics" on public.topics;
drop policy if exists "admins can update topics" on public.topics;
drop policy if exists "Admins can delete topics" on public.topics;

create policy "Anyone can read public topics"
on public.topics
for select
to anon, authenticated
using (
deleted_at is null
and status = any (
array[
'open'::text,
'active'::text,
'closed'::text
]
)
);

create policy "Admins can read all topics"
on public.topics
for select
to authenticated
using (public.is_admin());

create policy "Admins can create topics"
on public.topics
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update topics"
on public.topics
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete topics"
on public.topics
for delete
to authenticated
using (public.is_admin());

grant select on public.topics to anon;
grant select, insert, update, delete on public.topics to authenticated;
