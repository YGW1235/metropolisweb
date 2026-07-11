-- 016_drop_legacy_join_topic_overload.sql
-- Removes legacy join_topic(uuid) overload that used count-based side_index allocation.
-- Keeps the canonical join_topic(uuid, text) definition in sync with 008_fix_join_topic_side_index.sql.
-- Before applying to production, verify current function signatures in the Supabase Dashboard.

begin;

drop function if exists public.join_topic(uuid);

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

grant execute on function public.join_topic(uuid, text) to authenticated;

commit;

notify pgrst, 'reload schema';
