-- HN V17.6 admin hardening
-- Run once in Supabase SQL Editor. Client gallery public access continues through Edge Functions only.

alter table public.events enable row level security;
alter table public.photos enable row level security;
alter table public.selections enable row level security;
alter table public.selection_items enable row level security;

drop policy if exists "gallery_admin_all" on public.events;
create policy "gallery_admin_all" on public.events for all to authenticated using (public.is_gallery_admin()) with check (public.is_gallery_admin());
drop policy if exists "gallery_admin_all" on public.photos;
create policy "gallery_admin_all" on public.photos for all to authenticated using (public.is_gallery_admin()) with check (public.is_gallery_admin());
drop policy if exists "gallery_admin_all" on public.selections;
create policy "gallery_admin_all" on public.selections for all to authenticated using (public.is_gallery_admin()) with check (public.is_gallery_admin());
drop policy if exists "gallery_admin_all" on public.selection_items;
create policy "gallery_admin_all" on public.selection_items for all to authenticated using (public.is_gallery_admin()) with check (public.is_gallery_admin());
