-- 007_olive.sql
-- Olive tree retention feature

create table if not exists public.olive_trees (
user_id uuid primary key references auth.users(id) on delete cascade,
total_water_count integer not null default 0,
streak_count integer not null default 0,
best_streak_count integer not null default 0,
last_watered_on date,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now()
);

create table if not exists public.olive_watering_logs (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete cascade,
watered_on date not null,
created_at timestamp with time zone not null default now(),

constraint olive_watering_logs_user_id_watered_on_key
unique (user_id, watered_on)
);

alter table public.olive_trees enable row level security;
alter table public.olive_watering_logs enable row level security;

drop policy if exists "users can read own olive tree" on public.olive_trees;
drop policy if exists "users can read own olive watering logs" on public.olive_watering_logs;

create policy "users can read own olive tree"
on public.olive_trees
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can read own olive watering logs"
on public.olive_watering_logs
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.water_olive()
returns table (
total_water_count integer,
streak_count integer,
best_streak_count integer,
last_watered_on date,
already_watered boolean
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
v_user_id uuid := auth.uid();
v_today date := (now() at time zone 'Asia/Seoul')::date;
v_yesterday date := ((now() at time zone 'Asia/Seoul')::date - interval '1 day')::date;
v_tree public.olive_trees%rowtype;
v_new_streak integer;
begin
if v_user_id is null then
raise exception 'not_authenticated';
end if;

insert into public.olive_trees (
user_id,
total_water_count,
streak_count,
best_streak_count,
last_watered_on
)
values (
v_user_id,
0,
0,
0,
null
)
on conflict (user_id) do nothing;

select *
into v_tree
from public.olive_trees
where user_id = v_user_id
for update;

if v_tree.last_watered_on = v_today then
return query
select
v_tree.total_water_count,
v_tree.streak_count,
v_tree.best_streak_count,
v_tree.last_watered_on,
true;

return;

end if;

insert into public.olive_watering_logs (
user_id,
watered_on
)
values (
v_user_id,
v_today
)
on conflict (user_id, watered_on) do nothing;

if v_tree.last_watered_on = v_yesterday then
v_new_streak := v_tree.streak_count + 1;
else
v_new_streak := 1;
end if;

update public.olive_trees
set
total_water_count = v_tree.total_water_count + 1,
streak_count = v_new_streak,
best_streak_count = greatest(v_tree.best_streak_count, v_new_streak),
last_watered_on = v_today,
updated_at = now()
where user_id = v_user_id
returning *
into v_tree;

return query
select
v_tree.total_water_count,
v_tree.streak_count,
v_tree.best_streak_count,
v_tree.last_watered_on,
false;
end;
$function$;

grant select on public.olive_trees to authenticated;
grant select on public.olive_watering_logs to authenticated;
grant execute on function public.water_olive() to authenticated;
