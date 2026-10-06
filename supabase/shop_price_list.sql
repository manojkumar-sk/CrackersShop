-- Official price-list PDF for one shop.
-- Run this in the Supabase SQL Editor after supabase/shop_admin.sql.
-- Public visitors can read the current shop's PDF link.
-- Shop members upload, replace, and delete it.
-- It does not change products, prices, carts, or staff accounts.

create table if not exists public.shop_price_lists (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete restrict,
  file_name text not null,
  file_path text not null,
  file_url text not null,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_price_lists_shop_unique unique (shop_id),
  constraint shop_price_lists_file_name_not_blank check (length(trim(file_name)) > 0),
  constraint shop_price_lists_file_path_not_blank check (length(trim(file_path)) > 0),
  constraint shop_price_lists_file_url_not_blank check (length(trim(file_url)) > 0)
);

drop trigger if exists shop_price_lists_set_updated_at on public.shop_price_lists;
create trigger shop_price_lists_set_updated_at
before update on public.shop_price_lists
for each row execute function public.set_updated_at();

alter table public.shop_price_lists enable row level security;

drop policy if exists "Current shop price list is publicly readable" on public.shop_price_lists;
create policy "Current shop price list is publicly readable"
on public.shop_price_lists
for select
to anon, authenticated
using (shop_id = public.current_shop_id());

drop policy if exists "Shop members can read their price list" on public.shop_price_lists;
create policy "Shop members can read their price list"
on public.shop_price_lists
for select
to authenticated
using (public.is_shop_member(shop_id));

drop policy if exists "Shop members can insert their price list" on public.shop_price_lists;
create policy "Shop members can insert their price list"
on public.shop_price_lists
for insert
to authenticated
with check (public.is_shop_member(shop_id));

drop policy if exists "Shop members can update their price list" on public.shop_price_lists;
create policy "Shop members can update their price list"
on public.shop_price_lists
for update
to authenticated
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

drop policy if exists "Shop members can delete their price list" on public.shop_price_lists;
create policy "Shop members can delete their price list"
on public.shop_price_lists
for delete
to authenticated
using (public.is_shop_member(shop_id));

revoke all on public.shop_price_lists from anon, authenticated;
grant select on public.shop_price_lists to anon, authenticated;
grant insert, update, delete on public.shop_price_lists to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'price-lists',
  'price-lists',
  true,
  10485760,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read price lists" on storage.objects;
create policy "Public can read price lists"
on storage.objects
for select
to public
using (bucket_id = 'price-lists');

drop policy if exists "Shop staff can upload price lists" on storage.objects;
create policy "Shop staff can upload price lists"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'price-lists' and public.has_shop_membership());

drop policy if exists "Shop staff can update price lists" on storage.objects;
create policy "Shop staff can update price lists"
on storage.objects
for update
to authenticated
using (bucket_id = 'price-lists' and public.has_shop_membership())
with check (bucket_id = 'price-lists' and public.has_shop_membership());

drop policy if exists "Shop staff can delete price lists" on storage.objects;
create policy "Shop staff can delete price lists"
on storage.objects
for delete
to authenticated
using (bucket_id = 'price-lists' and public.has_shop_membership());
