-- Admin foundation. Run this in the Supabase SQL Editor after schema.sql.
-- It does not allow anonymous or ordinary signed-in users to change the catalogue.
--
-- 1. In Authentication → Users, create the admin with email and password.
-- 2. Turn off public sign-ups if this project should not accept customer accounts.
-- 3. Run this file.
-- 4. Grant that one account. Replace the address below, then run the insert.
--
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'admin@example.com';

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins can read categories" on public.categories;
create policy "Admins can read categories"
on public.categories
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read products" on public.products;
create policy "Admins can read products"
on public.products
for select
to authenticated
using (public.is_admin());
