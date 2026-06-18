-- 012_contact_inquiries.sql
-- Add public contact inquiries and admin inquiry management.

begin;

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  category text not null default 'general',
  title text not null,
  content text not null,
  status text not null default 'new',
  admin_note text,
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint contact_inquiries_category_check
    check (
      category = any (
        array[
          'general'::text,
          'account'::text,
          'report'::text,
          'bug'::text,
          'partnership'::text,
          'other'::text
        ]
      )
    ),

  constraint contact_inquiries_status_check
    check (
      status = any (
        array[
          'new'::text,
          'reviewing'::text,
          'resolved'::text,
          'dismissed'::text
        ]
      )
    ),

  constraint contact_inquiries_title_length
    check (char_length(trim(title)) >= 2),

  constraint contact_inquiries_content_length
    check (char_length(trim(content)) >= 5)
);

alter table public.contact_inquiries enable row level security;

create index if not exists contact_inquiries_user_id_idx
on public.contact_inquiries using btree (user_id);

create index if not exists contact_inquiries_status_idx
on public.contact_inquiries using btree (status);

create index if not exists contact_inquiries_created_at_idx
on public.contact_inquiries using btree (created_at desc);

drop trigger if exists contact_inquiries_set_updated_at
on public.contact_inquiries;

create trigger contact_inquiries_set_updated_at
before update on public.contact_inquiries
for each row
execute function public.set_updated_at();

drop policy if exists "users can read own contact inquiries"
on public.contact_inquiries;

drop policy if exists "admins can read all contact inquiries"
on public.contact_inquiries;

drop policy if exists "admins can update contact inquiries"
on public.contact_inquiries;

drop policy if exists "admins can delete contact inquiries"
on public.contact_inquiries;

create policy "users can read own contact inquiries"
on public.contact_inquiries
for select
to authenticated
using (auth.uid() = user_id);

create policy "admins can read all contact inquiries"
on public.contact_inquiries
for select
to authenticated
using (public.is_admin());

create policy "admins can update contact inquiries"
on public.contact_inquiries
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete contact inquiries"
on public.contact_inquiries
for delete
to authenticated
using (public.is_admin());

create or replace function public.create_contact_inquiry(
  p_email text,
  p_category text,
  p_title text,
  p_content text
)
returns public.contact_inquiries
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile_email text;
  v_email text;
  v_category text := lower(trim(coalesce(p_category, 'general')));
  v_result public.contact_inquiries%rowtype;
begin
  if v_user_id is not null then
    select email
    into v_profile_email
    from public.profiles
    where id = v_user_id;
  end if;

  v_email := lower(
    trim(
      coalesce(
        nullif(p_email, ''),
        v_profile_email,
        ''
      )
    )
  );

  if v_email = '' then
    raise exception '답변을 받을 이메일을 입력해주세요.';
  end if;

  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception '이메일 형식이 올바르지 않습니다.';
  end if;

  if v_category not in (
    'general',
    'account',
    'report',
    'bug',
    'partnership',
    'other'
  ) then
    v_category := 'general';
  end if;

  if length(trim(p_title)) < 2 then
    raise exception '문의 제목은 2자 이상 입력해주세요.';
  end if;

  if length(trim(p_content)) < 5 then
    raise exception '문의 내용은 5자 이상 입력해주세요.';
  end if;

  insert into public.contact_inquiries (
    user_id,
    email,
    category,
    title,
    content
  )
  values (
    v_user_id,
    v_email,
    v_category,
    trim(p_title),
    trim(p_content)
  )
  returning *
  into v_result;

  return v_result;
end;
$function$;

create or replace function public.admin_update_contact_inquiry(
  p_inquiry_id uuid,
  p_status text,
  p_admin_note text default null
)
returns public.contact_inquiries
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_admin_id uuid := auth.uid();
  v_status text := lower(trim(coalesce(p_status, 'reviewing')));
  v_note text := nullif(trim(coalesce(p_admin_note, '')), '');
  v_result public.contact_inquiries%rowtype;
begin
  if v_admin_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if v_status not in ('new', 'reviewing', 'resolved', 'dismissed') then
    raise exception '문의 상태가 올바르지 않습니다.';
  end if;

  update public.contact_inquiries
  set
    status = v_status,
    admin_note = v_note,
    handled_by = v_admin_id,
    handled_at = now()
  where id = p_inquiry_id
  returning *
  into v_result;

  if not found then
    raise exception '문의를 찾을 수 없습니다.';
  end if;

  perform public.log_admin_activity(
    'contact.' || v_status,
    'contact_inquiry',
    p_inquiry_id,
    '문의 상태를 변경했습니다.',
    jsonb_build_object(
      'status', v_status,
      'admin_note', v_note
    )
  );

  return v_result;
end;
$function$;

grant select, update, delete on public.contact_inquiries to authenticated;
grant execute on function public.create_contact_inquiry(text, text, text, text)
to anon, authenticated;
grant execute on function public.admin_update_contact_inquiry(uuid, text, text)
to authenticated;

commit;