-- Homepage slideshow for one shop.
-- Run this in the Supabase SQL Editor after supabase/shop_admin.sql.
-- Public visitors can read only active slides for the current shop.
-- Shop members can manage every slide for their own shop, the same way
-- they manage products and categories.
-- It does not change products, categories, carts, or staff accounts.

create table if not exists public.shop_slides (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete restrict,
  image_url text not null,
  image_path text not null,
  heading text not null,
  description text not null default '',
  primary_label text not null,
  primary_href text not null,
  secondary_label text,
  secondary_href text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_slides_heading_not_blank check (length(trim(heading)) > 0),
  constraint shop_slides_description_length check (char_length(description) <= 400),
  constraint shop_slides_primary_label_not_blank check (length(trim(primary_label)) > 0),
  constraint shop_slides_primary_href_not_blank check (length(trim(primary_href)) > 0),
  constraint shop_slides_secondary_pair check (
    (secondary_label is null and secondary_href is null)
    or (
      secondary_label is not null
      and secondary_href is not null
      and length(trim(secondary_label)) > 0
      and length(trim(secondary_href)) > 0
    )
  ),
  constraint shop_slides_order_nonnegative check (display_order >= 0)
);

create index if not exists shop_slides_shop_order_idx
  on public.shop_slides (shop_id, display_order, created_at);

drop trigger if exists shop_slides_set_updated_at on public.shop_slides;
create trigger shop_slides_set_updated_at
before update on public.shop_slides
for each row execute function public.set_updated_at();

alter table public.shop_slides enable row level security;

drop policy if exists "Active slides are publicly readable" on public.shop_slides;
create policy "Active slides are publicly readable"
on public.shop_slides
for select
to anon, authenticated
using (
  is_active = true
  and shop_id = public.current_shop_id()
);

drop policy if exists "Shop members can read their slides" on public.shop_slides;
create policy "Shop members can read their slides"
on public.shop_slides
for select
to authenticated
using (public.is_shop_member(shop_id));

drop policy if exists "Shop members can insert their slides" on public.shop_slides;
create policy "Shop members can insert their slides"
on public.shop_slides
for insert
to authenticated
with check (public.is_shop_member(shop_id));

drop policy if exists "Shop members can update their slides" on public.shop_slides;
create policy "Shop members can update their slides"
on public.shop_slides
for update
to authenticated
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

drop policy if exists "Shop members can delete their slides" on public.shop_slides;
create policy "Shop members can delete their slides"
on public.shop_slides
for delete
to authenticated
using (public.is_shop_member(shop_id));

revoke all on public.shop_slides from anon, authenticated;
grant select on public.shop_slides to anon, authenticated;
grant insert, update, delete on public.shop_slides to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'slide-images',
  'slide-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read slide images" on storage.objects;
create policy "Public can read slide images"
on storage.objects
for select
to public
using (bucket_id = 'slide-images');

drop policy if exists "Shop staff can upload slide images" on storage.objects;
create policy "Shop staff can upload slide images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'slide-images' and public.has_shop_membership());

drop policy if exists "Shop staff can update slide images" on storage.objects;
create policy "Shop staff can update slide images"
on storage.objects
for update
to authenticated
using (bucket_id = 'slide-images' and public.has_shop_membership())
with check (bucket_id = 'slide-images' and public.has_shop_membership());

drop policy if exists "Shop staff can delete slide images" on storage.objects;
create policy "Shop staff can delete slide images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'slide-images' and public.has_shop_membership());
