-- Run this in the Supabase SQL Editor before supabase/seed.sql.
-- Customer reads use the anon key. Catalogue writes are added in
-- supabase/admin_product_policies.sql and supabase/admin_category_policies.sql.
-- Those writes still require public.is_admin().

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null default '',
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_unique unique (slug),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint categories_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  slug text not null,
  description text not null default '',
  mrp integer not null,
  selling_price integer not null,
  discount_percentage integer not null,
  stock_quantity integer not null default 0,
  image_url text,
  badge text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_unique unique (slug),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint products_name_not_blank check (length(trim(name)) > 0),
  constraint products_mrp_nonnegative check (mrp >= 0),
  constraint products_selling_price_nonnegative check (selling_price >= 0),
  constraint products_selling_price_not_above_mrp check (selling_price <= mrp),
  constraint products_discount_range check (discount_percentage between 0 and 100),
  constraint products_discount_matches_price check (
    discount_percentage = (
      case
        when mrp = 0 or selling_price >= mrp then 0
        else round((mrp - selling_price) * 100.0 / mrp)::integer
      end
    )
  ),
  constraint products_stock_nonnegative check (stock_quantity >= 0),
  constraint products_badge_known check (
    badge is null or badge in ('Popular', 'Best Seller')
  )
);

create index if not exists categories_is_active_idx on public.categories (is_active);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_is_active_idx on public.products (is_active);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "Active categories are publicly readable" on public.categories;
create policy "Active categories are publicly readable"
on public.categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Active products are publicly readable" on public.products;
create policy "Active products are publicly readable"
on public.products
for select
to anon, authenticated
using (is_active = true);

grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
revoke insert, update, delete on public.categories from anon;
grant insert, update, delete on public.categories to authenticated;
revoke insert, update, delete on public.products from anon;
grant insert, update, delete on public.products to authenticated;
