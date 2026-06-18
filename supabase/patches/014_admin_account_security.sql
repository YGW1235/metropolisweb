-- 014_admin_account_security.sql
-- Add admin account security status RPC.

begin;

create or replace function public.get_admin_security_status()
returns table (
  total_admin_count bigint,
  active_admin_count bigint,
  suspended_admin_count bigint,
  deleted_admin_count bigint,
  unverified_admin_count bigint,
  current_admin_id uuid,
  current_admin_email text,
  current_admin_profile_status text,
  current_admin_email_confirmed_at timestamp with time zone,
  has_active_admin boolean,
  has_backup_admin boolean,
  has_unverified_admin boolean
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
  with admin_profiles as (
    select
      p.id::uuid as id,
      p.email::text as email,
      p.status::text as status
    from public.profiles as p
    where p.role = 'admin'
  ),
  admin_auth as (
    select
      au.id::uuid as id,
      au.email::text as email,
      au.email_confirmed_at::timestamp with time zone as email_confirmed_at
    from auth.users as au
    join admin_profiles as ap
      on ap.id = au.id
  ),
  current_admin as (
    select
      ap.id::uuid as id,
      coalesce(aa.email, ap.email)::text as email,
      ap.status::text as status,
      aa.email_confirmed_at::timestamp with time zone as email_confirmed_at
    from admin_profiles as ap
    left join admin_auth as aa
      on aa.id = ap.id
    where ap.id = auth.uid()
    limit 1
  )
  select
    count(ap.id)::bigint as total_admin_count,
    count(ap.id) filter (where ap.status = 'active')::bigint as active_admin_count,
    count(ap.id) filter (where ap.status = 'suspended')::bigint as suspended_admin_count,
    count(ap.id) filter (where ap.status = 'deleted')::bigint as deleted_admin_count,
    count(ap.id) filter (
      where ap.status = 'active'
        and aa.email_confirmed_at is null
    )::bigint as unverified_admin_count,

    ca.id::uuid as current_admin_id,
    ca.email::text as current_admin_email,
    ca.status::text as current_admin_profile_status,
    ca.email_confirmed_at::timestamp with time zone as current_admin_email_confirmed_at,

    (count(ap.id) filter (where ap.status = 'active') >= 1)::boolean as has_active_admin,
    (count(ap.id) filter (where ap.status = 'active') >= 2)::boolean as has_backup_admin,
    (
      count(ap.id) filter (
        where ap.status = 'active'
          and aa.email_confirmed_at is null
      ) > 0
    )::boolean as has_unverified_admin
  from admin_profiles as ap
  left join admin_auth as aa
    on aa.id = ap.id
  cross join current_admin as ca
  group by
    ca.id,
    ca.email,
    ca.status,
    ca.email_confirmed_at;
end;
$function$;

grant execute on function public.get_admin_security_status()
to authenticated;

commit;

notify pgrst, 'reload schema';