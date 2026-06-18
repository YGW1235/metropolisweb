-- 013_account_deletion_request.sql
-- Add self account deletion request flow.

begin;

alter table public.profiles
add column if not exists status_reason text;

alter table public.profiles
add column if not exists status_changed_by uuid references auth.users(id) on delete set null;

alter table public.profiles
add column if not exists status_changed_at timestamp with time zone;

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  status text not null default 'completed',
  created_at timestamp with time zone not null default now(),
  processed_at timestamp with time zone,

  constraint account_deletion_requests_status_check
    check (
      status = any (
        array[
          'requested'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
);

alter table public.account_deletion_requests enable row level security;

create index if not exists account_deletion_requests_user_id_idx
on public.account_deletion_requests using btree (user_id);

create index if not exists account_deletion_requests_status_idx
on public.account_deletion_requests using btree (status);

create index if not exists account_deletion_requests_created_at_idx
on public.account_deletion_requests using btree (created_at desc);

drop policy if exists "users can read own account deletion requests"
on public.account_deletion_requests;

drop policy if exists "admins can read account deletion requests"
on public.account_deletion_requests;

create policy "users can read own account deletion requests"
on public.account_deletion_requests
for select
to authenticated
using (auth.uid() = user_id);

create policy "admins can read account deletion requests"
on public.account_deletion_requests
for select
to authenticated
using (public.is_admin());

create or replace function public.request_account_deletion(
  p_reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
  v_result public.profiles%rowtype;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception '프로필을 찾을 수 없습니다.';
  end if;

  if v_profile.role = 'admin' then
    raise exception '관리자 계정은 이 화면에서 탈퇴할 수 없습니다. 다른 관리자에게 권한 이전 후 처리해주세요.';
  end if;

  if v_profile.status = 'deleted' then
    return v_profile;
  end if;

  insert into public.account_deletion_requests (
    user_id,
    reason,
    status,
    processed_at
  )
  values (
    v_user_id,
    v_reason,
    'completed',
    now()
  );

  update public.profiles
  set
    email = null,
    display_name = '탈퇴한 사용자',
    status = 'deleted',
    status_reason = coalesce(v_reason, '사용자 직접 탈퇴'),
    status_changed_by = null,
    status_changed_at = now()
  where id = v_user_id
  returning *
  into v_result;

  return v_result;
end;
$function$;

grant select on public.account_deletion_requests to authenticated;
grant execute on function public.request_account_deletion(text) to authenticated;

commit;