-- Run this whole file in the Supabase SQL Editor after supabase/admin.sql.
-- It creates the public category-images bucket, admin-only image policies,
-- and admin-only category write policies.
-- Public visitors can still read only active categories.
-- Ordinary signed-in users cannot create, change, or delete categories or images.
-- Product image policies are left in place.

revoke insert, update, delete on public.categories from anon;
grant insert, update, delete on public.categories to authenticated;

drop policy if exists "Admins can insert categories" on public.categories;
create policy "Admins can insert categories"
on public.categories
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update categories" on public.categories;
create policy "Admins can update categories"
on public.categories
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete categories" on public.categories;
create policy "Admins can delete categories"
on public.categories
for delete
to authenticated
using (public.is_admin());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'category-images',
  'category-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read category images" on storage.objects;
create policy "Public can read category images"
on storage.objects
for select
to public
using (bucket_id = 'category-images');

drop policy if exists "Admins can upload category images" on storage.objects;
create policy "Admins can upload category images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'category-images'
  and public.is_admin()
);

drop policy if exists "Admins can update category images" on storage.objects;
create policy "Admins can update category images"
on storage.objects
for update
to authenticated
using (bucket_id = 'category-images' and public.is_admin())
with check (bucket_id = 'category-images' and public.is_admin());

drop policy if exists "Admins can delete category images" on storage.objects;
create policy "Admins can delete category images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'category-images' and public.is_admin());

grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;
