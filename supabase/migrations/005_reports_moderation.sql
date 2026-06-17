-- 005_reports_moderation.sql
-- Reports and moderation

create table if not exists public.reports (
id uuid primary key default gen_random_uuid(),
reporter_id uuid not null references public.profiles(id) on delete cascade,
topic_id uuid not null references public.topics(id) on delete cascade,
post_id uuid references public.debate_posts(id) on delete cascade,
target_type text not null,
target_id uuid not null,
reason text not null,
detail text,
status text not null default 'pending',
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),

constraint reports_target_type_check
check (target_type = any (array['post'::text, 'comment'::text])),

constraint reports_status_check
check (
status = any (
array[
'pending'::text,
'reviewing'::text,
'resolved'::text,
'dismissed'::text
]
)
),

constraint reports_reporter_id_target_type_target_id_key
unique (reporter_id, target_type, target_id)
);

alter table public.reports enable row level security;

create index if not exists reports_topic_id_idx
on public.reports using btree (topic_id);

create index if not exists reports_post_id_idx
on public.reports using btree (post_id);

create index if not exists reports_status_idx
on public.reports using btree (status);

create index if not exists reports_created_at_idx
on public.reports using btree (created_at desc);

drop trigger if exists set_reports_updated_at on public.reports;

create trigger set_reports_updated_at
before update on public.reports
for each row
execute function public.set_updated_at();

create or replace function public.create_report(
p_target_type text,
p_target_id uuid,
p_reason text,
p_detail text default null
)
returns public.reports
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
v_user_id uuid := auth.uid();
v_profile public.profiles%rowtype;
v_topic_id uuid;
v_post_id uuid;
v_existing public.reports%rowtype;
v_result public.reports%rowtype;
begin
if v_user_id is null then
raise exception '로그인이 필요합니다.';
end if;

select *
into v_profile
from public.profiles
where id = v_user_id;

if not found or v_profile.status <> 'active' then
raise exception '활성화된 유저만 신고할 수 있습니다.';
end if;

if p_target_type not in ('post', 'comment') then
raise exception '신고 대상이 올바르지 않습니다.';
end if;

if length(trim(p_reason)) < 2 then
raise exception '신고 사유를 선택해야 합니다.';
end if;

if p_target_type = 'post' then
select topic_id, id
into v_topic_id, v_post_id
from public.debate_posts
where id = p_target_id
and status = 'visible';

```
if not found then
  raise exception '신고할 게시글을 찾을 수 없습니다.';
end if;
```

end if;

if p_target_type = 'comment' then
select topic_id, post_id
into v_topic_id, v_post_id
from public.debate_comments
where id = p_target_id
and status = 'visible';

```
if not found then
  raise exception '신고할 댓글을 찾을 수 없습니다.';
end if;
```

end if;

if not exists (
select 1
from public.topics t
where t.id = v_topic_id
and t.deleted_at is null
) then
raise exception '신고할 수 없는 토론 주제입니다.';
end if;

if not exists (
select 1
from public.topic_participants tp
where tp.topic_id = v_topic_id
and tp.user_id = v_user_id
) then
raise exception '주제에 참가한 유저만 신고할 수 있습니다.';
end if;

select *
into v_existing
from public.reports
where reporter_id = v_user_id
and target_type = p_target_type
and target_id = p_target_id;

if found then
return v_existing;
end if;

insert into public.reports (
reporter_id,
topic_id,
post_id,
target_type,
target_id,
reason,
detail
)
values (
v_user_id,
v_topic_id,
v_post_id,
p_target_type,
p_target_id,
trim(p_reason),
nullif(trim(coalesce(p_detail, '')), '')
)
returning *
into v_result;

return v_result;
end;
$function$;

create or replace function public.moderate_report(
p_report_id uuid,
p_action text,
p_note text default null
)
returns public.reports
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
v_user_id uuid := auth.uid();
v_report public.reports%rowtype;
v_result public.reports%rowtype;
begin
if v_user_id is null then
raise exception '로그인이 필요합니다.';
end if;

if not public.is_admin() then
raise exception '관리자 권한이 필요합니다.';
end if;

select *
into v_report
from public.reports
where id = p_report_id
for update;

if not found then
raise exception '신고를 찾을 수 없습니다.';
end if;

if p_action not in ('reviewing', 'hide_target', 'dismiss') then
raise exception '처리 방식이 올바르지 않습니다.';
end if;

if p_action = 'reviewing' then
update public.reports
set status = 'reviewing'
where id = p_report_id
returning *
into v_result;

```
return v_result;
```

end if;

if p_action = 'dismiss' then
update public.reports
set status = 'dismissed'
where id = p_report_id
returning *
into v_result;

```
return v_result;
```

end if;

if p_action = 'hide_target' then
if v_report.target_type = 'post' then
update public.debate_posts
set status = 'hidden'
where id = v_report.target_id;
elsif v_report.target_type = 'comment' then
update public.debate_comments
set status = 'hidden'
where id = v_report.target_id;
else
raise exception '신고 대상이 올바르지 않습니다.';
end if;

```
update public.reports
set status = 'resolved'
where id = p_report_id
returning *
into v_result;

return v_result;
```

end if;

raise exception '처리할 수 없는 요청입니다.';
end;
$function$;

drop policy if exists "Users can read own reports" on public.reports;
drop policy if exists "Admins can read all reports" on public.reports;
drop policy if exists "Admins can update reports" on public.reports;
drop policy if exists "Admins can delete reports" on public.reports;

create policy "Users can read own reports"
on public.reports
for select
to authenticated
using ((select auth.uid()) = reporter_id);

create policy "Admins can read all reports"
on public.reports
for select
to authenticated
using (public.is_admin());

create policy "Admins can update reports"
on public.reports
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete reports"
on public.reports
for delete
to authenticated
using (public.is_admin());

grant select, update, delete on public.reports to authenticated;

grant execute on function public.create_report(text, uuid, text, text) to authenticated;
grant execute on function public.moderate_report(uuid, text, text) to authenticated;
