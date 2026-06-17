-- 008_storage.sql
-- Supabase Storage settings for debate post images

insert into storage.buckets (
id,
name,
public,
file_size_limit,
allowed_mime_types
)
values (
'debate-images',
'debate-images',
true,
5242880,
array[
'image/jpeg',
'image/png',
'image/webp'
]
)
on conflict (id) do update
set
name = excluded.name,
public = excluded.public,
file_size_limit = excluded.file_size_limit,
allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can read debate images" on storage.objects;
drop policy if exists "authenticated users can upload debate images" on storage.objects;
drop policy if exists "authors can delete own debate images" on storage.objects;

create policy "public can read debate images"
on storage.objects
for select
to anon, authenticated
using (
bucket_id = 'debate-images'
);

create policy "authenticated users can upload debate images"
on storage.objects
for insert
to authenticated
with check (
bucket_id = 'debate-images'
and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "authors can delete own debate images"
on storage.objects
for delete
to authenticated
using (
bucket_id = 'debate-images'
and (storage.foldername(name))[2] = auth.uid()::text
);
