-- 002_public_anonymous_read_rpc.sql
-- Public anonymous read RPCs
-- These functions expose debate content with anonymous author labels
-- instead of exposing raw user_id / author_id values.

begin;

---

-- Public participant counts by topic

---

create or replace function public.get_public_topic_participant_counts(
p_topic_id uuid
)
returns table (
pro_count bigint,
con_count bigint,
total_count bigint
)
language sql
stable
security definer
set search_path to 'public'
as $function$
select
count(*) filter (where tp.assigned_side = 'pro') as pro_count,
count(*) filter (where tp.assigned_side = 'con') as con_count,
count(*) as total_count
from public.topic_participants tp
join public.topics t on t.id = tp.topic_id
where tp.topic_id = p_topic_id
and t.deleted_at is null
and t.status = any (
array[
'open'::text,
'active'::text,
'closed'::text
]
);
$function$;

---

-- Public debate post list

---

create or replace function public.get_public_debate_posts(
p_topic_id uuid,
p_side text default null
)
returns table (
id uuid,
topic_id uuid,
side text,
title text,
content text,
created_at timestamp with time zone,
updated_at timestamp with time zone,
image_url text,
author_label text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
select
p.id,
p.topic_id,
p.side,
p.title,
p.content,
p.created_at,
p.updated_at,
p.image_url,
case
when tp.assigned_side = 'pro' then '찬성 익명 ' || tp.side_index::text
when tp.assigned_side = 'con' then '반대 익명 ' || tp.side_index::text
else '익명'
end as author_label
from public.debate_posts p
join public.topics t on t.id = p.topic_id
left join public.topic_participants tp
on tp.topic_id = p.topic_id
and tp.user_id = p.author_id
where p.topic_id = p_topic_id
and p.status = 'visible'
and t.deleted_at is null
and t.status = any (
array[
'open'::text,
'active'::text,
'closed'::text
]
)
and (
p_side is null
or p_side not in ('pro', 'con')
or p.side = p_side
)
order by p.created_at desc;
$function$;

---

-- Public single debate post detail

---

create or replace function public.get_public_debate_post(
p_post_id uuid
)
returns table (
id uuid,
topic_id uuid,
side text,
title text,
content text,
created_at timestamp with time zone,
updated_at timestamp with time zone,
image_url text,
author_label text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
select
p.id,
p.topic_id,
p.side,
p.title,
p.content,
p.created_at,
p.updated_at,
p.image_url,
case
when tp.assigned_side = 'pro' then '찬성 익명 ' || tp.side_index::text
when tp.assigned_side = 'con' then '반대 익명 ' || tp.side_index::text
else '익명'
end as author_label
from public.debate_posts p
join public.topics t on t.id = p.topic_id
left join public.topic_participants tp
on tp.topic_id = p.topic_id
and tp.user_id = p.author_id
where p.id = p_post_id
and p.status = 'visible'
and t.deleted_at is null
and t.status = any (
array[
'open'::text,
'active'::text,
'closed'::text
]
);
$function$;

---

-- Public debate comments by topic

---

create or replace function public.get_public_debate_comments(
p_topic_id uuid
)
returns table (
id uuid,
post_id uuid,
topic_id uuid,
side text,
content text,
created_at timestamp with time zone,
updated_at timestamp with time zone,
author_label text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
select
c.id,
c.post_id,
c.topic_id,
c.side,
c.content,
c.created_at,
c.updated_at,
case
when tp.assigned_side = 'pro' then '찬성 익명 ' || tp.side_index::text
when tp.assigned_side = 'con' then '반대 익명 ' || tp.side_index::text
else '익명'
end as author_label
from public.debate_comments c
join public.debate_posts p on p.id = c.post_id
join public.topics t on t.id = c.topic_id
left join public.topic_participants tp
on tp.topic_id = c.topic_id
and tp.user_id = c.author_id
where c.topic_id = p_topic_id
and c.status = 'visible'
and p.status = 'visible'
and t.deleted_at is null
and t.status = any (
array[
'open'::text,
'active'::text,
'closed'::text
]
)
order by c.created_at asc;
$function$;

---

-- Public debate comments by post

---

create or replace function public.get_public_debate_comments_by_post(
p_post_id uuid
)
returns table (
id uuid,
post_id uuid,
topic_id uuid,
side text,
content text,
created_at timestamp with time zone,
updated_at timestamp with time zone,
author_label text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
select
c.id,
c.post_id,
c.topic_id,
c.side,
c.content,
c.created_at,
c.updated_at,
case
when tp.assigned_side = 'pro' then '찬성 익명 ' || tp.side_index::text
when tp.assigned_side = 'con' then '반대 익명 ' || tp.side_index::text
else '익명'
end as author_label
from public.debate_comments c
join public.debate_posts p on p.id = c.post_id
join public.topics t on t.id = c.topic_id
left join public.topic_participants tp
on tp.topic_id = c.topic_id
and tp.user_id = c.author_id
where c.post_id = p_post_id
and c.status = 'visible'
and p.status = 'visible'
and t.deleted_at is null
and t.status = any (
array[
'open'::text,
'active'::text,
'closed'::text
]
)
order by c.created_at asc;
$function$;

grant execute on function public.get_public_topic_participant_counts(uuid) to anon, authenticated;
grant execute on function public.get_public_debate_posts(uuid, text) to anon, authenticated;
grant execute on function public.get_public_debate_post(uuid) to anon, authenticated;
grant execute on function public.get_public_debate_comments(uuid) to anon, authenticated;
grant execute on function public.get_public_debate_comments_by_post(uuid) to anon, authenticated;

commit;
