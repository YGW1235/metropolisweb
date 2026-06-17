-- 004_posts_comments.sql
-- Debate posts and comments

create table if not exists public.debate_posts (
id uuid primary key default gen_random_uuid(),
topic_id uuid not null references public.topics(id) on delete cascade,
author_id uuid not null references public.profiles(id) on delete cascade,
side text not null,
title text not null,
content text not null,
status text not null default 'visible',
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
image_url text,
image_path text,

constraint debate_posts_side_check
check (side = any (array['pro'::text, 'con'::text])),

constraint debate_posts_status_check
check (status = any (array['visible'::text, 'hidden'::text, 'deleted'::text]))
);

create table if not exists public.debate_comments (
id uuid primary key default gen_random_uuid(),
post_id uuid not null references public.debate_posts(id) on delete cascade,
topic_id uuid not null references public.topics(id) on delete cascade,
author_id uuid not null references public.profiles(id) on delete cascade,
content text not null,
status text not null default 'visible',
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
side text,

constraint debate_comments_side_check
check (side = any (array['pro'::text, 'con'::text])),

constraint debate_comments_status_check
check (status = any (array['visible'::text, 'hidden'::text, 'deleted'::text]))
);

alter table public.debate_posts enable row level security;
alter table public.debate_comments enable row level security;

create index if not exists debate_posts_topic_id_idx
on public.debate_posts using btree (topic_id);

create index if not exists debate_posts_author_id_idx
on public.debate_posts using btree (author_id);

create index if not exists debate_posts_created_at_idx
on public.debate_posts using btree (created_at desc);

create index if not exists debate_comments_post_id_idx
on public.debate_comments using btree (post_id);

create index if not exists debate_comments_topic_id_idx
on public.debate_comments using btree (topic_id);

create index if not exists debate_comments_author_id_idx
on public.debate_comments using btree (author_id);

create index if not exists debate_comments_created_at_idx
on public.debate_comments using btree (created_at);

drop trigger if exists set_debate_posts_updated_at on public.debate_posts;

create trigger set_debate_posts_updated_at
before update on public.debate_posts
for each row
execute function public.set_updated_at();

drop trigger if exists set_debate_comments_updated_at on public.debate_comments;

create trigger set_debate_comments_updated_at
before update on public.debate_comments
for each row
execute function public.set_updated_at();

create or replace function public.create_debate_post(
p_topic_id uuid,
p_title text,
p_content text
)
returns public.debate_posts
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
v_user_id uuid := auth.uid();
v_profile public.profiles%rowtype;
v_topic public.topics%rowtype;
v_participation public.topic_participants%rowtype;
v_result public.debate_posts%rowtype;
begin
if v_user_id is null then
raise exception '로그인이 필요합니다.';
end if;

select *
into v_profile
from public.profiles
where id = v_user_id;

if not found or v_profile.status <> 'active' then
raise exception '활성화된 유저만 글을 작성할 수 있습니다.';
end if;

select *
into v_topic
from public.topics
where id = p_topic_id
and deleted_at is null;

if not found then
raise exception '토론 주제를 찾을 수 없습니다.';
end if;

if v_topic.status not in ('open', 'active') then
raise exception '현재 글을 작성할 수 없는 주제입니다.';
end if;

select *
into v_participation
from public.topic_participants
where topic_id = p_topic_id
and user_id = v_user_id;

if not found then
raise exception '주제에 참가한 유저만 글을 작성할 수 있습니다.';
end if;

if length(trim(p_title)) < 2 then
raise exception '제목은 2자 이상 입력해야 합니다.';
end if;

if length(trim(p_content)) < 5 then
raise exception '내용은 5자 이상 입력해야 합니다.';
end if;

insert into public.debate_posts (
topic_id,
author_id,
side,
title,
content
)
values (
p_topic_id,
v_user_id,
v_participation.assigned_side,
trim(p_title),
trim(p_content)
)
returning *
into v_result;

return v_result;
end;
$function$;

create or replace function public.create_debate_comment(
p_post_id uuid,
p_content text
)
returns public.debate_comments
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
v_user_id uuid := auth.uid();
v_profile public.profiles%rowtype;
v_post public.debate_posts%rowtype;
v_topic public.topics%rowtype;
v_participation public.topic_participants%rowtype;
v_result public.debate_comments%rowtype;
begin
if v_user_id is null then
raise exception '로그인이 필요합니다.';
end if;

select *
into v_profile
from public.profiles
where id = v_user_id;

if not found or v_profile.status <> 'active' then
raise exception '활성화된 유저만 댓글을 작성할 수 있습니다.';
end if;

select *
into v_post
from public.debate_posts
where id = p_post_id
and status = 'visible';

if not found then
raise exception '게시글을 찾을 수 없습니다.';
end if;

select *
into v_topic
from public.topics
where id = v_post.topic_id
and deleted_at is null;

if not found then
raise exception '토론 주제를 찾을 수 없습니다.';
end if;

if v_topic.status not in ('open', 'active') then
raise exception '현재 댓글을 작성할 수 없는 주제입니다.';
end if;

select *
into v_participation
from public.topic_participants
where topic_id = v_post.topic_id
and user_id = v_user_id;

if not found then
raise exception '주제에 참가한 유저만 댓글을 작성할 수 있습니다.';
end if;

if length(trim(p_content)) < 2 then
raise exception '댓글은 2자 이상 입력해야 합니다.';
end if;

insert into public.debate_comments (
post_id,
topic_id,
author_id,
side,
content
)
values (
p_post_id,
v_post.topic_id,
v_user_id,
v_participation.assigned_side,
trim(p_content)
)
returning *
into v_result;

return v_result;
end;
$function$;

create or replace function public.delete_my_debate_comment(
p_comment_id uuid
)
returns public.debate_comments
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
v_user_id uuid := auth.uid();
v_comment public.debate_comments%rowtype;
v_result public.debate_comments%rowtype;
begin
if v_user_id is null then
raise exception '로그인이 필요합니다.';
end if;

select *
into v_comment
from public.debate_comments
where id = p_comment_id
for update;

if not found then
raise exception '댓글을 찾을 수 없습니다.';
end if;

if v_comment.author_id <> v_user_id then
raise exception '작성자만 댓글을 삭제할 수 있습니다.';
end if;

if v_comment.status = 'deleted' then
return v_comment;
end if;

update public.debate_comments
set status = 'deleted'
where id = p_comment_id
returning *
into v_result;

return v_result;
end;
$function$;

drop policy if exists "public can read visible debate posts" on public.debate_posts;
drop policy if exists "Participants can read visible debate posts" on public.debate_posts;
drop policy if exists "Admins can read all debate posts" on public.debate_posts;
drop policy if exists "Admins can update debate posts" on public.debate_posts;
drop policy if exists "Admins can delete debate posts" on public.debate_posts;
drop policy if exists "authors can update own debate posts" on public.debate_posts;

create policy "public can read visible debate posts"
on public.debate_posts
for select
to anon, authenticated
using (status = 'visible');

create policy "Participants can read visible debate posts"
on public.debate_posts
for select
to authenticated
using (
status = 'visible'
and exists (
select 1
from public.topic_participants tp
where tp.topic_id = debate_posts.topic_id
and tp.user_id = (select auth.uid())
)
);

create policy "Admins can read all debate posts"
on public.debate_posts
for select
to authenticated
using (public.is_admin());

create policy "authors can update own debate posts"
on public.debate_posts
for update
to authenticated
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

create policy "Admins can update debate posts"
on public.debate_posts
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete debate posts"
on public.debate_posts
for delete
to authenticated
using (public.is_admin());

drop policy if exists "public can read visible debate comments" on public.debate_comments;
drop policy if exists "Participants can read visible debate comments" on public.debate_comments;
drop policy if exists "Admins can read all debate comments" on public.debate_comments;
drop policy if exists "Admins can update debate comments" on public.debate_comments;
drop policy if exists "Admins can delete debate comments" on public.debate_comments;

create policy "public can read visible debate comments"
on public.debate_comments
for select
to anon, authenticated
using (status = 'visible');

create policy "Participants can read visible debate comments"
on public.debate_comments
for select
to authenticated
using (
status = 'visible'
and exists (
select 1
from public.topic_participants tp
where tp.topic_id = debate_comments.topic_id
and tp.user_id = (select auth.uid())
)
);

create policy "Admins can read all debate comments"
on public.debate_comments
for select
to authenticated
using (public.is_admin());

create policy "Admins can update debate comments"
on public.debate_comments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete debate comments"
on public.debate_comments
for delete
to authenticated
using (public.is_admin());

grant select on public.debate_posts to anon;
grant select, update, delete on public.debate_posts to authenticated;

grant select on public.debate_comments to anon;
grant select, update, delete on public.debate_comments to authenticated;

grant execute on function public.create_debate_post(uuid, text, text) to authenticated;
grant execute on function public.create_debate_comment(uuid, text) to authenticated;
grant execute on function public.delete_my_debate_comment(uuid) to authenticated;
