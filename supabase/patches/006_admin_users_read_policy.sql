-- 006_admin_users_read_policy.sql
-- Allow admins to read all profiles for the admin user management page.

begin;

drop policy if exists "Admins can read all profiles" on public.profiles;

create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

grant select on public.profiles to authenticated;

commit;