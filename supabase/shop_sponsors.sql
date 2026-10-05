-- Sponsor and brand logos for the Cracker Store homepage.
-- Run this in the Supabase SQL Editor after supabase/shop_admin.sql.
-- Public visitors can read only active sponsors for the current shop.
-- Shop members manage sponsors the same way they manage slides.

create table if not exists public.shop_sponsors (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete restrict,
  name text not null,
  logo_url text not null,
  logo_path text not null,
  website_url text,
  description text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_sponsors_name_not_blank check (length(trim(name)) > 0),
  constraint shop_sponsors_description_length check (
    description is null or char_length(description) <= 180
  ),
  constraint shop_sponsors_order_nonnegative check (display_order >= 0)
);

create index if not exists shop_sponsors_shop_order_idx
  on public.shop_sponsors (shop_id, display_order, created_at);

drop trigger if exists shop_sponsors_set_updated_at on public.shop_sponsors;
create trigger shop_sponsors_set_updated_at
before update on public.shop_sponsors
for each row execute function public.set_updated_at();

alter table public.shop_sponsors enable row level security;

drop policy if exists "Active sponsors are publicly readable" on public.shop_sponsors;
create policy "Active sponsors are publicly readable"
on public.shop_sponsors
for select
to anon, authenticated
using (
  is_active = true
  and shop_id = public.current_shop_id()
);

drop policy if exists "Shop members can read their sponsors" on public.shop_sponsors;
create policy "Shop members can read their sponsors"
on public.shop_sponsors
for select
to authenticated
using (public.is_shop_member(shop_id));

drop policy if exists "Shop members can insert their sponsors" on public.shop_sponsors;
create policy "Shop members can insert their sponsors"
on public.shop_sponsors
for insert
to authenticated
with check (public.is_shop_member(shop_id));

drop policy if exists "Shop members can update their sponsors" on public.shop_sponsors;
create policy "Shop members can update their sponsors"
on public.shop_sponsors
for update
to authenticated
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

drop policy if exists "Shop members can delete their sponsors" on public.shop_sponsors;
create policy "Shop members can delete their sponsors"
on public.shop_sponsors
for delete
to authenticated
using (public.is_shop_member(shop_id));

revoke all on public.shop_sponsors from anon, authenticated;
grant select on public.shop_sponsors to anon, authenticated;
grant insert, update, delete on public.shop_sponsors to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'sponsor-images',
  'sponsor-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read sponsor images" on storage.objects;
create policy "Public can read sponsor images"
on storage.objects
for select
to public
using (bucket_id = 'sponsor-images');

drop policy if exists "Shop staff can upload sponsor images" on storage.objects;
create policy "Shop staff can upload sponsor images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'sponsor-images' and public.has_shop_membership());

drop policy if exists "Shop staff can update sponsor images" on storage.objects;
create policy "Shop staff can update sponsor images"
on storage.objects
for update
to authenticated
using (bucket_id = 'sponsor-images' and public.has_shop_membership())
with check (bucket_id = 'sponsor-images' and public.has_shop_membership());

drop policy if exists "Shop staff can delete sponsor images" on storage.objects;
create policy "Shop staff can delete sponsor images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'sponsor-images' and public.has_shop_membership());
