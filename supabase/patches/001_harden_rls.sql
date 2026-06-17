-- 001_harden_rls.sql
-- Harden current production RLS policies
-- Run this on the existing Supabase project only after reviewing it.

begin;

---

-- topics: remove overly broad public read policy

---

drop policy if exists "public can read topics" on public.topics;
drop policy if exists "Anyone can read public topics" on public.topics;

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

---

-- topics: remove duplicated admin update policies

---

drop policy if exists "Admins can update topics" on public.topics;
drop policy if exists "admins can update topics" on public.topics;

create policy "Admins can update topics"
on public.topics
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

---

-- topic_participants: align direct insert policy with join_topic()
-- join_topic() only allows joining open topics, so RLS should match.

---

drop policy if exists "authenticated users can join topics" on public.topic_participants;

create policy "authenticated users can join topics"
on public.topic_participants
for insert
to authenticated
with check (
auth.uid() = user_id
and assigned_side = any (array['pro'::text, 'con'::text])
and exists (
select 1
from public.topics
where topics.id = topic_participants.topic_id
and topics.status = 'open'
and topics.deleted_at is null
)
);

commit;
