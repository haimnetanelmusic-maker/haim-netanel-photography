-- HN Client Galleries V17 migration
-- Run once in Supabase SQL Editor.

alter table public.photos add column if not exists preview_path text;

-- Only authenticated gallery admins may operate directly on the private bucket.
drop policy if exists "gallery_admin_storage_select" on storage.objects;
create policy "gallery_admin_storage_select" on storage.objects for select to authenticated
using (bucket_id = 'client-galleries' and public.is_gallery_admin());

drop policy if exists "gallery_admin_storage_insert" on storage.objects;
create policy "gallery_admin_storage_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'client-galleries' and public.is_gallery_admin());

drop policy if exists "gallery_admin_storage_update" on storage.objects;
create policy "gallery_admin_storage_update" on storage.objects for update to authenticated
using (bucket_id = 'client-galleries' and public.is_gallery_admin())
with check (bucket_id = 'client-galleries' and public.is_gallery_admin());

drop policy if exists "gallery_admin_storage_delete" on storage.objects;
create policy "gallery_admin_storage_delete" on storage.objects for delete to authenticated
using (bucket_id = 'client-galleries' and public.is_gallery_admin());
