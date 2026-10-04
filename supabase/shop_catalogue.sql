-- Catalogue shop ownership. Run this in the Supabase SQL Editor after supabase/shops.sql.
-- It attaches every existing category and product to Cracker Store.
-- It does not delete rows, change ids, slugs, prices, images, stock, or timestamps.
--
-- Do not re-run supabase/admin.sql, supabase/admin_product_policies.sql, or
-- supabase/admin_category_policies.sql after this file. Those older files
-- recreate catalogue policies that are not limited to one shop.
-- Storage policies are left unchanged.

-- Until shop routing exists, public reads resolve to this shop only.
create or replace function public.current_shop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.shops
  where id = 'c0000000-0000-4000-8000-000000000001'
    and slug = 'cracker-store'
    and active = true;
$$;

revoke all on function public.current_shop_id() from public;
grant execute on function public.current_shop_id() to anon, authenticated;

alter table public.categories
  add column if not exists shop_id uuid;

alter table public.products
  add column if not exists shop_id uuid;

-- Keep created_at and updated_at. The normal update trigger would stamp updated_at.
alter table public.categories disable trigger categories_set_updated_at;
alter table public.products disable trigger products_set_updated_at;

update public.categories
set shop_id = 'c0000000-0000-4000-8000-000000000001'
where shop_id is null;

update public.products
set shop_id = 'c0000000-0000-4000-8000-000000000001'
where shop_id is null;

alter table public.categories enable trigger categories_set_updated_at;
alter table public.products enable trigger products_set_updated_at;

do $$
declare
  category_missing integer;
  product_missing integer;
begin
  select count(*) into category_missing
  from public.categories
  where shop_id is distinct from 'c0000000-0000-4000-8000-000000000001';

  select count(*) into product_missing
  from public.products
  where shop_id is distinct from 'c0000000-0000-4000-8000-000000000001';

  if category_missing > 0 or product_missing > 0 then
    raise exception
      'Catalogue shop backfill is incomplete. Categories outside Cracker Store: %, products: %.',
      category_missing,
      product_missing;
  end if;
end $$;

alter table public.categories
  alter column shop_id set not null;

alter table public.products
  alter column shop_id set not null;

-- Current admin forms do not send shop_id yet. New rows stay on Cracker Store.
alter table public.categories
  alter column shop_id set default 'c0000000-0000-4000-8000-000000000001';

alter table public.products
  alter column shop_id set default 'c0000000-0000-4000-8000-000000000001';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'categories_shop_id_fkey'
      and conrelid = 'public.categories'::regclass
  ) then
    alter table public.categories
      add constraint categories_shop_id_fkey
      foreign key (shop_id) references public.shops (id) on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_shop_id_fkey'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_shop_id_fkey
      foreign key (shop_id) references public.shops (id) on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'categories_id_shop_id_unique'
      and conrelid = 'public.categories'::regclass
  ) then
    alter table public.categories
      add constraint categories_id_shop_id_unique unique (id, shop_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_category_same_shop_fkey'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_category_same_shop_fkey
      foreign key (category_id, shop_id)
      references public.categories (id, shop_id)
      on delete restrict;
  end if;
end $$;

-- Global slug uniqueness blocks another shop from using the same slug.
-- UNIQUE (shop_id, slug) also indexes shop_id, so a second shop_id index is not added.
alter table public.categories
  drop constraint if exists categories_slug_unique;

alter table public.products
  drop constraint if exists products_slug_unique;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'categories_shop_slug_unique'
      and conrelid = 'public.categories'::regclass
  ) then
    alter table public.categories
      add constraint categories_shop_slug_unique unique (shop_id, slug);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_shop_slug_unique'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_shop_slug_unique unique (shop_id, slug);
  end if;
end $$;

drop policy if exists "Active categories are publicly readable" on public.categories;
create policy "Active categories are publicly readable"
on public.categories
for select
to anon, authenticated
using (
  is_active = true
  and shop_id = public.current_shop_id()
);

drop policy if exists "Active products are publicly readable" on public.products;
create policy "Active products are publicly readable"
on public.products
for select
to anon, authenticated
using (
  is_active = true
  and shop_id = public.current_shop_id()
);

drop policy if exists "Admins can read categories" on public.categories;
drop policy if exists "Shop members can read their categories" on public.categories;
create policy "Shop members can read their categories"
on public.categories
for select
to authenticated
using (public.is_admin() and public.is_shop_member(shop_id));

drop policy if exists "Admins can read products" on public.products;
drop policy if exists "Shop members can read their products" on public.products;
create policy "Shop members can read their products"
on public.products
for select
to authenticated
using (public.is_admin() and public.is_shop_member(shop_id));

drop policy if exists "Admins can insert categories" on public.categories;
drop policy if exists "Shop members can insert their categories" on public.categories;
create policy "Shop members can insert their categories"
on public.categories
for insert
to authenticated
with check (public.is_admin() and public.is_shop_member(shop_id));

drop policy if exists "Admins can update categories" on public.categories;
drop policy if exists "Shop members can update their categories" on public.categories;
create policy "Shop members can update their categories"
on public.categories
for update
to authenticated
using (public.is_admin() and public.is_shop_member(shop_id))
with check (public.is_admin() and public.is_shop_member(shop_id));

drop policy if exists "Admins can delete categories" on public.categories;
drop policy if exists "Shop members can delete their categories" on public.categories;
create policy "Shop members can delete their categories"
on public.categories
for delete
to authenticated
using (public.is_admin() and public.is_shop_member(shop_id));

drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Shop members can insert their products" on public.products;
create policy "Shop members can insert their products"
on public.products
for insert
to authenticated
with check (public.is_admin() and public.is_shop_member(shop_id));

drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Shop members can update their products" on public.products;
create policy "Shop members can update their products"
on public.products
for update
to authenticated
using (public.is_admin() and public.is_shop_member(shop_id))
with check (public.is_admin() and public.is_shop_member(shop_id));

drop policy if exists "Admins can delete products" on public.products;
drop policy if exists "Shop members can delete their products" on public.products;
create policy "Shop members can delete their products"
on public.products
for delete
to authenticated
using (public.is_admin() and public.is_shop_member(shop_id));

do $verify$
declare
  category_count integer;
  product_count integer;
  category_nulls integer;
  product_nulls integer;
  category_other integer;
  product_other integer;
  product_shop_mismatch integer;
begin
  select count(*) into category_count from public.categories;
  select count(*) into product_count from public.products;

  select count(*) into category_nulls
  from public.categories
  where shop_id is null;

  select count(*) into product_nulls
  from public.products
  where shop_id is null;

  select count(*) into category_other
  from public.categories
  where shop_id <> 'c0000000-0000-4000-8000-000000000001';

  select count(*) into product_other
  from public.products
  where shop_id <> 'c0000000-0000-4000-8000-000000000001';

  select count(*) into product_shop_mismatch
  from public.products
  join public.categories on categories.id = products.category_id
  where products.shop_id is distinct from categories.shop_id;

  if category_nulls > 0
    or product_nulls > 0
    or category_other > 0
    or product_other > 0
    or product_shop_mismatch > 0
  then
    raise exception
      'Catalogue shop check failed. Category nulls: %, product nulls: %, categories outside Cracker Store: %, products outside Cracker Store: %, products in another shop than their category: %.',
      category_nulls,
      product_nulls,
      category_other,
      product_other,
      product_shop_mismatch;
  end if;

  raise notice
    'Cracker Store catalogue verified: % categories, % products, no null shop_id.',
    category_count,
    product_count;
end
$verify$;
