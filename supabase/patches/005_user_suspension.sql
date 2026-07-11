-- 005_user_suspension.sql
-- Add user suspension / reinstatement moderation feature

begin;

---

-- Add current moderation status metadata to profiles

---

alter table public.profiles
add column if not exists status_reason text;

alter table public.profiles
add column if not exists status_changed_by uuid references auth.users(id) on delete set null;

alter table public.profiles
add column if not exists status_changed_at timestamp with time zone;

create index if not exists profiles_status_idx
on public.profiles using btree (status);

create index if not exists profiles_status_changed_at_idx
on public.profiles using btree (status_changed_at desc);

---

-- User moderation history

---

create table if not exists public.user_moderation_logs (
id uuid primary key default gen_random_uuid(),
target_user_id uuid not null references public.profiles(id) on delete cascade,
moderator_id uuid references auth.users(id) on delete set null,
action text not null,
previous_status text,
new_status text not null,
reason text,
created_at timestamp with time zone not null default now(),

constraint user_moderation_logs_action_check
check (action = any (array['suspend'::text, 'reinstate'::text])),

constraint user_moderation_logs_new_status_check
check (new_status = any (array['active'::text, 'suspended'::text]))
);

alter table public.user_moderation_logs enable row level security;

create index if not exists user_moderation_logs_target_user_id_idx
on public.user_moderation_logs using btree (target_user_id);

create index if not exists user_moderation_logs_moderator_id_idx
on public.user_moderation_logs using btree (moderator_id);

create index if not exists user_moderation_logs_created_at_idx
on public.user_moderation_logs using btree (created_at desc);

drop policy if exists "admins can read user moderation logs"
on public.user_moderation_logs;

create policy "admins can read user moderation logs"
on public.user_moderation_logs
for select
to authenticated
using (public.is_admin());

---

-- Generic admin user status update RPC

---

create or replace function public.admin_set_user_status(
p_user_id uuid,
p_status text,
p_reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
v_admin_id uuid := auth.uid();
v_target public.profiles%rowtype;
v_result public.profiles%rowtype;
v_action text;
v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
if v_admin_id is null then
raise exception '로그인이 필요합니다.';
end if;

if not public.is_admin() then
raise exception '관리자 권한이 필요합니다.';
end if;

if p_user_id = v_admin_id then
raise exception '자기 자신의 상태는 이 기능으로 변경할 수 없습니다.';
end if;

if p_status not in ('active', 'suspended') then
raise exception '변경할 수 없는 유저 상태입니다.';
end if;

select *
into v_target
from public.profiles
where id = p_user_id
for update;

if not found then
raise exception '대상 유저를 찾을 수 없습니다.';
end if;

if v_target.role = 'admin' and p_status = 'suspended' then
raise exception '관리자 계정은 이 기능으로 정지할 수 없습니다.';
end if;

if v_target.status = p_status then
return v_target;
end if;

if p_status = 'suspended' then
v_action := 'suspend';
else
v_action := 'reinstate';
end if;

update public.profiles
set
status = p_status,
status_reason = v_reason,
status_changed_by = v_admin_id,
status_changed_at = now()
where id = p_user_id
returning *
into v_result;

insert into public.user_moderation_logs (
target_user_id,
moderator_id,
action,
previous_status,
new_status,
reason
)
values (
p_user_id,
v_admin_id,
v_action,
v_target.status,
p_status,
v_reason
);

return v_result;
end;
$function$;

---

-- Report-based target author status update RPC

---

create or replace function public.admin_set_report_target_author_status(
p_report_id uuid,
p_status text,
p_reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
v_report public.reports%rowtype;
v_target_user_id uuid;
begin
if auth.uid() is null then
raise exception '로그인이 필요합니다.';
end if;

if not public.is_admin() then
raise exception '관리자 권한이 필요합니다.';
end if;

select *
into v_report
from public.reports
where id = p_report_id;

if not found then
raise exception '신고를 찾을 수 없습니다.';
end if;

if v_report.target_type = 'post' then
select author_id
into v_target_user_id
from public.debate_posts
where id = v_report.target_id;
elsif v_report.target_type = 'comment' then
select author_id
into v_target_user_id
from public.debate_comments
where id = v_report.target_id;
else
raise exception '신고 대상이 올바르지 않습니다.';
end if;

if v_target_user_id is null then
raise exception '신고 대상 작성자를 찾을 수 없습니다.';
end if;

return public.admin_set_user_status(
v_target_user_id,
p_status,
p_reason
);
end;
$function$;

---

-- Harden join_topic: suspended users cannot newly join topics

---

drop function if exists public.join_topic(uuid);
drop function if exists public.join_topic(uuid, text);

create or replace function public.join_topic(
  p_topic_id uuid,
  p_join_side text default 'auto'
)
returns public.topic_participants
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_topic public.topics%rowtype;
  v_existing public.topic_participants%rowtype;
  v_join_side text := lower(trim(coalesce(p_join_side, 'auto')));
  v_pro_count integer;
  v_con_count integer;
  v_assigned_side text;
  v_side_index integer;
  v_result public.topic_participants%rowtype;
  v_attempt integer := 0;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_topic_id::text));

  select *
  into v_profile
  from public.profiles
  where id = v_user_id;

  if not found or v_profile.status <> 'active' then
    raise exception '활성화된 유저만 주제에 참가할 수 있습니다.';
  end if;

  select *
  into v_topic
  from public.topics
  where id = p_topic_id
  for update;

  if not found then
    raise exception '토론 주제를 찾을 수 없습니다.';
  end if;

  if v_topic.deleted_at is not null then
    raise exception '삭제된 주제에는 참가할 수 없습니다.';
  end if;

  select *
  into v_existing
  from public.topic_participants
  where topic_id = p_topic_id
    and user_id = v_user_id;

  if found then
    return v_existing;
  end if;

  if v_topic.status <> 'open' then
    raise exception '현재 참가할 수 없는 주제입니다.';
  end if;

  if v_join_side not in ('auto', 'pro', 'con') then
    v_join_side := 'auto';
  end if;

  select
    count(*) filter (where assigned_side = 'pro'),
    count(*) filter (where assigned_side = 'con')
  into v_pro_count, v_con_count
  from public.topic_participants
  where topic_id = p_topic_id;

  if v_join_side = 'pro' then
    v_assigned_side := 'pro';
  elsif v_join_side = 'con' then
    v_assigned_side := 'con';
  else
    if v_pro_count < v_con_count then
      v_assigned_side := 'pro';
    elsif v_con_count < v_pro_count then
      v_assigned_side := 'con';
    else
      if random() < 0.5 then
        v_assigned_side := 'pro';
      else
        v_assigned_side := 'con';
      end if;
    end if;
  end if;

  loop
    v_attempt := v_attempt + 1;

    select coalesce(max(side_index), 0) + 1
    into v_side_index
    from public.topic_participants
    where topic_id = p_topic_id
      and assigned_side = v_assigned_side;

    begin
      insert into public.topic_participants (
        topic_id,
        user_id,
        assigned_side,
        side_index
      )
      values (
        p_topic_id,
        v_user_id,
        v_assigned_side,
        v_side_index
      )
      returning *
      into v_result;

      return v_result;

    exception
      when unique_violation then
        if v_attempt >= 5 then
          raise exception '참가 번호 배정 중 충돌이 발생했습니다. 다시 시도해주세요.';
        end if;
    end;
  end loop;
end;
$function$;

grant select on public.user_moderation_logs to authenticated;

grant execute on function public.admin_set_user_status(uuid, text, text)
to authenticated;

grant execute on function public.admin_set_report_target_author_status(uuid, text, text)
to authenticated;

grant execute on function public.join_topic(uuid, text)
to authenticated;

commit;
