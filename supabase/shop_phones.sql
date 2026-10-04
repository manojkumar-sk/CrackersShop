-- Multiple shop phone numbers. Run this in the Supabase SQL Editor after
-- supabase/shop_settings.sql.
--
-- shop_phone_numbers is the contact list. shops.whatsapp_number and
-- shops.phone_number stay in place. The app refreshes them from this table:
-- whatsapp_number is the primary WhatsApp number, and phone_number is the
-- first other number. Storefront and settings read this table.
-- Catalogue policies are not changed.

create table if not exists public.shop_phone_numbers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  phone_number text not null,
  is_whatsapp boolean not null default false,
  is_primary boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_phone_numbers_digits check (phone_number ~ '^[0-9]{10,15}$'),
  constraint shop_phone_numbers_shop_phone_unique unique (shop_id, phone_number),
  constraint shop_phone_numbers_primary_whatsapp check (
    is_primary = false or is_whatsapp = true
  ),
  constraint shop_phone_numbers_display_order_nonnegative check (display_order >= 0)
);

create unique index if not exists shop_phone_numbers_one_primary
on public.shop_phone_numbers (shop_id)
where is_primary;

create index if not exists shop_phone_numbers_shop_order_idx
on public.shop_phone_numbers (shop_id, display_order);

create or replace function public.protect_shop_phone_shop()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.shop_id is distinct from old.shop_id then
    raise exception 'Phone numbers cannot move between shops';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_shop_phone_shop() from public, anon;

drop trigger if exists shop_phone_numbers_protect_shop on public.shop_phone_numbers;
create trigger shop_phone_numbers_protect_shop
before update on public.shop_phone_numbers
for each row execute function public.protect_shop_phone_shop();

drop trigger if exists shop_phone_numbers_set_updated_at on public.shop_phone_numbers;
create trigger shop_phone_numbers_set_updated_at
before update on public.shop_phone_numbers
for each row execute function public.set_updated_at();

insert into public.shop_phone_numbers (
  shop_id,
  phone_number,
  is_whatsapp,
  is_primary,
  display_order
)
select shops.id, shops.whatsapp_number, true, true, 0
from public.shops
where shops.whatsapp_number is not null
on conflict (shop_id, phone_number) do nothing;

insert into public.shop_phone_numbers (
  shop_id,
  phone_number,
  is_whatsapp,
  is_primary,
  display_order
)
select
  shops.id,
  shops.phone_number,
  false,
  false,
  case when shops.whatsapp_number is null then 0 else 1 end
from public.shops
where shops.phone_number is not null
  and shops.phone_number is distinct from shops.whatsapp_number
on conflict (shop_id, phone_number) do nothing;

alter table public.shop_phone_numbers enable row level security;

revoke all on table public.shop_phone_numbers from anon, authenticated;
grant select on table public.shop_phone_numbers to anon, authenticated;
grant insert, update, delete on table public.shop_phone_numbers to authenticated;

drop policy if exists "Active shop phone numbers are publicly readable" on public.shop_phone_numbers;
create policy "Active shop phone numbers are publicly readable"
on public.shop_phone_numbers
for select
to anon
using (
  exists (
    select 1
    from public.shops
    where shops.id = shop_phone_numbers.shop_id
      and shops.active = true
  )
);

drop policy if exists "Members can read their shop phone numbers" on public.shop_phone_numbers;
create policy "Members can read their shop phone numbers"
on public.shop_phone_numbers
for select
to authenticated
using (public.is_shop_member(shop_id));

drop policy if exists "Platform admins can read shop phone numbers" on public.shop_phone_numbers;
create policy "Platform admins can read shop phone numbers"
on public.shop_phone_numbers
for select
to authenticated
using (public.is_admin());

drop policy if exists "Shop owners can insert shop phone numbers" on public.shop_phone_numbers;
create policy "Shop owners can insert shop phone numbers"
on public.shop_phone_numbers
for insert
to authenticated
with check (public.is_shop_owner(shop_id));

drop policy if exists "Shop owners can update shop phone numbers" on public.shop_phone_numbers;
create policy "Shop owners can update shop phone numbers"
on public.shop_phone_numbers
for update
to authenticated
using (public.is_shop_owner(shop_id))
with check (public.is_shop_owner(shop_id));

drop policy if exists "Shop owners can delete shop phone numbers" on public.shop_phone_numbers;
create policy "Shop owners can delete shop phone numbers"
on public.shop_phone_numbers
for delete
to authenticated
using (public.is_shop_owner(shop_id));

drop policy if exists "Platform admins can insert shop phone numbers" on public.shop_phone_numbers;
create policy "Platform admins can insert shop phone numbers"
on public.shop_phone_numbers
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Platform admins can update shop phone numbers" on public.shop_phone_numbers;
create policy "Platform admins can update shop phone numbers"
on public.shop_phone_numbers
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Platform admins can delete shop phone numbers" on public.shop_phone_numbers;
create policy "Platform admins can delete shop phone numbers"
on public.shop_phone_numbers
for delete
to authenticated
using (public.is_admin());
