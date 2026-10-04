-- Public shop routing. Run this in the Supabase SQL Editor after supabase/shop_catalogue.sql.
-- Anonymous storefront requests need to read an active shop by slug, then that
-- shop's active catalogue. The app still filters every query by the shop id it
-- resolved from the hostname. This does not change admin policies, shop_members,
-- or the composite products/categories foreign key.
--
-- current_shop_id() stays in the database, but public reads no longer use it.

grant select on table public.shops to anon;

drop policy if exists "Active shops are publicly readable" on public.shops;
create policy "Active shops are publicly readable"
on public.shops
for select
to anon
using (active = true);

drop policy if exists "Active categories are publicly readable" on public.categories;
create policy "Active categories are publicly readable"
on public.categories
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.shops
    where shops.id = categories.shop_id
      and shops.active = true
  )
);

drop policy if exists "Active products are publicly readable" on public.products;
create policy "Active products are publicly readable"
on public.products
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.shops
    where shops.id = products.shop_id
      and shops.active = true
  )
);

-- Temporary second shop for hostname isolation checks. It has no catalogue rows.
insert into public.shops (name, slug, active, whatsapp_number)
values ('Second Shop', 'second-shop', true, '919000000001')
on conflict (slug) do nothing;
