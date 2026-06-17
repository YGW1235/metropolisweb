-- 001_profiles.sql
-- Profiles, roles, auth user trigger, admin helper, profile update RPC

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user',
  status text not null default 'active',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint profiles_role_check
    check (role = any (array['user'::text, 'moderator'::text, 'admin'::text])),

  constraint profiles_status_check
    check (status = any (array['active'::text, 'suspended'::text, 'deleted'::text]))
);

alter table public.profiles enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    )
  );

  return new;
end;
$function$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
      and profiles.status = 'active'
  );
$function$;

create or replace function public.update_my_profile(p_display_name text)
returns public.profiles
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_result public.profiles%rowtype;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if length(trim(p_display_name)) < 2 then
    raise exception '닉네임은 2자 이상 입력해야 합니다.';
  end if;

  if length(trim(p_display_name)) > 20 then
    raise exception '닉네임은 20자 이하로 입력해야 합니다.';
  end if;

  update public.profiles
  set display_name = trim(p_display_name)
  where id = v_user_id
  returning *
  into v_result;

  if not found then
    raise exception '프로필을 찾을 수 없습니다.';
  end if;

  return v_result;
end;
$function$;

drop policy if exists "Users can read own profile" on public.profiles;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

grant execute on function public.is_admin() to authenticated;
grant execute on function public.update_my_profile(text) to authenticated;