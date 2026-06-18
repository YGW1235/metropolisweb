begin;

alter table public.reports
add column if not exists moderation_note text;

alter table public.reports
add column if not exists moderated_by uuid references auth.users(id) on delete set null;

alter table public.reports
add column if not exists moderated_at timestamp with time zone;

create index if not exists reports_moderated_at_idx
on public.reports using btree (moderated_at desc);

create index if not exists reports_moderated_by_idx
on public.reports using btree (moderated_by);

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

    return v_result;
  end if;

  if p_action = 'dismiss' then
    update public.reports
    set
      status = 'dismissed',
      moderation_note = v_clean_note,
      moderated_by = v_user_id,
      moderated_at = now()
    where id = p_report_id
    returning *
    into v_result;

    return v_result;
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

    update public.reports
    set
      status = 'resolved',
      moderation_note = v_clean_note,
      moderated_by = v_user_id,
      moderated_at = now()
    where id = p_report_id
    returning *
    into v_result;

    return v_result;
  end if;

  raise exception '처리할 수 없는 요청입니다.';
end;
$function$;

grant execute on function public.moderate_report(uuid, text, text) to authenticated;

commit;