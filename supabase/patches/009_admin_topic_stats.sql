-- 009_admin_topic_stats.sql
-- Add admin topic statistics RPC.

begin;

create or replace function public.get_admin_topic_stats()
returns table (
  topic_id uuid,
  title text,
  status text,
  created_at timestamp with time zone,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  deleted_at timestamp with time zone,
  pro_count bigint,
  con_count bigint,
  total_participants bigint,
  post_count bigint,
  comment_count bigint,
  report_count bigint,
  pending_report_count bigint,
  last_post_at timestamp with time zone,
  last_comment_at timestamp with time zone
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  return query
  select
    t.id as topic_id,
    t.title as title,
    t.status as status,
    t.created_at as created_at,
    t.starts_at as starts_at,
    t.ends_at as ends_at,
    t.deleted_at as deleted_at,

    coalesce(tp_stats.pro_count, 0::bigint) as pro_count,
    coalesce(tp_stats.con_count, 0::bigint) as con_count,
    coalesce(tp_stats.total_participants, 0::bigint) as total_participants,

    coalesce(post_stats.post_count, 0::bigint) as post_count,
    coalesce(comment_stats.comment_count, 0::bigint) as comment_count,

    coalesce(report_stats.report_count, 0::bigint) as report_count,
    coalesce(report_stats.pending_report_count, 0::bigint) as pending_report_count,

    post_stats.last_post_at as last_post_at,
    comment_stats.last_comment_at as last_comment_at
  from public.topics as t
  left join (
    select
      tp.topic_id as topic_id,
      count(*) filter (where tp.assigned_side = 'pro') as pro_count,
      count(*) filter (where tp.assigned_side = 'con') as con_count,
      count(*) as total_participants
    from public.topic_participants as tp
    group by tp.topic_id
  ) as tp_stats on tp_stats.topic_id = t.id
  left join (
    select
      dp.topic_id as topic_id,
      count(*) filter (where dp.status <> 'deleted') as post_count,
      max(dp.created_at) filter (where dp.status <> 'deleted') as last_post_at
    from public.debate_posts as dp
    group by dp.topic_id
  ) as post_stats on post_stats.topic_id = t.id
  left join (
    select
      dc.topic_id as topic_id,
      count(*) filter (where dc.status <> 'deleted') as comment_count,
      max(dc.created_at) filter (where dc.status <> 'deleted') as last_comment_at
    from public.debate_comments as dc
    group by dc.topic_id
  ) as comment_stats on comment_stats.topic_id = t.id
  left join (
    select
      r.topic_id as topic_id,
      count(*) as report_count,
      count(*) filter (where r.status = 'pending') as pending_report_count
    from public.reports as r
    group by r.topic_id
  ) as report_stats on report_stats.topic_id = t.id
  order by t.created_at desc;
end;
$function$;

grant execute on function public.get_admin_topic_stats()
to authenticated;

commit;