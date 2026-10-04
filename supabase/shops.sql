-- Shop foundation. Run this in the Supabase SQL Editor after supabase/admin.sql.
-- It creates the first shop and maps every current public.admin_users row
-- to that shop as owner. It does not create an auth user, and it does not
-- change public.products or public.categories.
--
-- The SQL Editor runs as the database owner, so it can read admin_users.
-- The anon key cannot.

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  logo_url text,
  whatsapp_number text,
  phone_number text,
  address text,
  email text,
  business_hours text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shops_slug_unique unique (slug),
  constraint shops_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint shops_name_not_blank check (length(trim(name)) > 0),
  constraint shops_whatsapp_digits check (
    whatsapp_number is null or whatsapp_number ~ '^[0-9]{10,15}$'
  ),
  constraint shops_phone_digits check (
    phone_number is null or phone_number ~ '^[0-9]{10,15}$'
  ),
  constraint shops_email_not_blank check (
    email is null or length(trim(email)) > 0
  )
);

create table if not exists public.shop_members (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  constraint shop_members_shop_user_unique unique (shop_id, user_id),
  constraint shop_members_role_known check (role in ('owner', 'admin'))
);

create index if not exists shops_active_idx on public.shops (active);
create index if not exists shop_members_user_id_idx on public.shop_members (user_id);

drop trigger if exists shops_set_updated_at on public.shops;
create trigger shops_set_updated_at
before update on public.shops
for each row execute function public.set_updated_at();

-- Stable id for the original shop. A second run keeps this row.
insert into public.shops (id, name, slug, whatsapp_number, active)
values (
  'c0000000-0000-4000-8000-000000000001',
  'Cracker Store',
  'cracker-store',
  '919994700409',
  true
)
on conflict (slug) do nothing;

insert into public.shop_members (shop_id, user_id, role)
select shops.id, admin_users.user_id, 'owner'
from public.admin_users
join public.shops on shops.slug = 'cracker-store'
on conflict (shop_id, user_id) do nothing;

do $$
declare
  owner_count integer;
begin
  select count(*) into owner_count
  from public.shop_members
  join public.shops on shops.id = shop_members.shop_id
  where shops.slug = 'cracker-store'
    and shop_members.role = 'owner';

  if owner_count < 1 then
    raise exception
      'Cracker Store has no owner. public.admin_users did not contain a user to map.';
  end if;
end $$;

create or replace function public.is_shop_member(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_members
    where shop_id = target_shop_id
      and user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_shop_member(uuid) from public, anon;
grant execute on function public.is_shop_member(uuid) to authenticated;

alter table public.shops enable row level security;
alter table public.shop_members enable row level security;

revoke all on table public.shops from anon, authenticated;
revoke all on table public.shop_members from anon, authenticated;
grant select on table public.shops to authenticated;
grant select on table public.shop_members to authenticated;

drop policy if exists "Members can read their shops" on public.shops;
create policy "Members can read their shops"
on public.shops
for select
to authenticated
using (public.is_shop_member(id));

drop policy if exists "Members can read their own membership" on public.shop_members;
create policy "Members can read their own membership"
on public.shop_members
for select
to authenticated
using (user_id = (select auth.uid()));
