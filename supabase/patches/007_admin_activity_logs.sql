-- 007_admin_activity_logs.sql
-- Add admin activity logs for moderation and user management.

begin;

-- ------------------------------------------------------------
-- Admin activity logs
-- ------------------------------------------------------------

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

alter table public.admin_activity_logs enable row level security;

create index if not exists admin_activity_logs_actor_id_idx
on public.admin_activity_logs using btree (actor_id);

create index if not exists admin_activity_logs_action_idx
on public.admin_activity_logs using btree (action);

create index if not exists admin_activity_logs_target_idx
on public.admin_activity_logs using btree (target_type, target_id);

create index if not exists admin_activity_logs_created_at_idx
on public.admin_activity_logs using btree (created_at desc);

drop policy if exists "admins can read admin activity logs"
on public.admin_activity_logs;

create policy "admins can read admin activity logs"
on public.admin_activity_logs
for select
to authenticated
using (public.is_admin());

-- ------------------------------------------------------------
-- Admin log helper RPC
-- ------------------------------------------------------------

create or replace function public.log_admin_activity(
  p_action text,
  p_target_type text,
  p_target_id uuid default null,
  p_summary text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.admin_activity_logs
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_result public.admin_activity_logs%rowtype;
begin
  if v_actor_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  insert into public.admin_activity_logs (
    actor_id,
    action,
    target_type,
    target_id,
    summary,
    metadata
  )
  values (
    v_actor_id,
    trim(p_action),
    trim(p_target_type),
    p_target_id,
    nullif(trim(coalesce(p_summary, '')), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning *
  into v_result;

  return v_result;
end;
$function$;

grant select on public.admin_activity_logs to authenticated;
grant execute on function public.log_admin_activity(text, text, uuid, text, jsonb)
to authenticated;

-- ------------------------------------------------------------
-- Update moderate_report() to write admin activity logs
-- ------------------------------------------------------------

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
  v_clean_note text := nullif(trim(coalesce(p_note, '')), '');
  v_log_action text;
  v_log_summary text;
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
    set
      status = 'reviewing',
      moderation_note = v_clean_note,
      moderated_by = v_user_id,
      moderated_at = now()
    where id = p_report_id
    returning *
    into v_result;

    v_log_action := 'report.reviewing';
    v_log_summary := '신고를 검토 중으로 변경했습니다.';
  elsif p_action = 'dismiss' then
    update public.reports
    set
      status = 'dismissed',
      moderation_note = v_clean_note,
      moderated_by = v_user_id,
      moderated_at = now()
    where id = p_report_id
    returning *
    into v_result;

    v_log_action := 'report.dismissed';
    v_log_summary := '신고를 기각했습니다.';
  elsif p_action = 'hide_target' then
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

    update public.reports
    set
      status = 'resolved',
      moderation_note = v_clean_note,
      moderated_by = v_user_id,
      moderated_at = now()
    where id = p_report_id
    returning *
    into v_result;

    v_log_action := 'report.hide_target';
    v_log_summary := '신고 대상을 숨김 처리했습니다.';
  end if;

  insert into public.admin_activity_logs (
    actor_id,
    action,
    target_type,
    target_id,
    summary,
    metadata
  )
  values (
    v_user_id,
    v_log_action,
    'report',
    p_report_id,
    v_log_summary,
    jsonb_build_object(
      'report_id', p_report_id,
      'target_type', v_report.target_type,
      'target_id', v_report.target_id,
      'topic_id', v_report.topic_id,
      'post_id', v_report.post_id,
      'note', v_clean_note
    )
  );

  return v_result;
end;
$function$;

grant execute on function public.moderate_report(uuid, text, text)
to authenticated;

-- ------------------------------------------------------------
-- Update admin_set_user_status() to write admin activity logs
-- ------------------------------------------------------------

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

  insert into public.admin_activity_logs (
    actor_id,
    action,
    target_type,
    target_id,
    summary,
    metadata
  )
  values (
    v_admin_id,
    case
      when p_status = 'suspended' then 'user.suspended'
      else 'user.reinstated'
    end,
    'user',
    p_user_id,
    case
      when p_status = 'suspended' then '유저를 정지했습니다.'
      else '유저를 복구했습니다.'
    end,
    jsonb_build_object(
      'target_user_id', p_user_id,
      'previous_status', v_target.status,
      'new_status', p_status,
      'reason', v_reason
    )
  );

  return v_result;
end;
$function$;

grant execute on function public.admin_set_user_status(uuid, text, text)
to authenticated;

commit;