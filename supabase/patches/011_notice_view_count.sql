-- 011_notice_view_count.sql
-- Add notice view count and public notice detail RPC.

begin;

alter table public.notices
add column if not exists view_count bigint not null default 0;

create index if not exists notices_view_count_idx
on public.notices using btree (view_count desc);

create or replace function public.get_public_notice(
  p_notice_id uuid
)
returns table (
  id uuid,
  title text,
  content text,
  status text,
  is_pinned boolean,
  published_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  view_count bigint
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return query
  update public.notices n
  set view_count = n.view_count + 1
  where n.id = p_notice_id
    and n.status = 'published'
  returning
    n.id,
    n.title,
    n.content,
    n.status,
    n.is_pinned,
    n.published_at,
    n.created_at,
    n.updated_at,
    n.view_count;
end;
$function$;

grant execute on function public.get_public_notice(uuid)
to anon, authenticated;

commit;