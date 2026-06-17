-- 006_notices.sql
-- Notices

create table if not exists public.notices (
id uuid primary key default gen_random_uuid(),
title text not null,
content text not null,
status text not null default 'published',
is_pinned boolean not null default false,
created_by uuid references auth.users(id) on delete set null,
published_at timestamp with time zone,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),

constraint notices_status_check
check (status = any (array['draft'::text, 'published'::text])),

constraint notices_title_length
check (char_length(trim(title)) >= 2),

constraint notices_content_length
check (char_length(trim(content)) >= 5)
);

alter table public.notices enable row level security;

create index if not exists notices_status_created_at_idx
on public.notices using btree (status, created_at desc);

create index if not exists notices_pinned_created_at_idx
on public.notices using btree (is_pinned desc, created_at desc);

drop trigger if exists notices_set_updated_at on public.notices;

create trigger notices_set_updated_at
before update on public.notices
for each row
execute function public.set_updated_at();

drop policy if exists "public can read published notices" on public.notices;
drop policy if exists "admins can read all notices" on public.notices;
drop policy if exists "admins can create notices" on public.notices;
drop policy if exists "admins can update notices" on public.notices;
drop policy if exists "admins can delete notices" on public.notices;

create policy "public can read published notices"
on public.notices
for select
to anon, authenticated
using (status = 'published');

create policy "admins can read all notices"
on public.notices
for select
to authenticated
using (public.is_admin());

create policy "admins can create notices"
on public.notices
for insert
to authenticated
with check (
public.is_admin()
and created_by = auth.uid()
);

create policy "admins can update notices"
on public.notices
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete notices"
on public.notices
for delete
to authenticated
using (public.is_admin());

grant select on public.notices to anon;
grant select, insert, update, delete on public.notices to authenticated;
