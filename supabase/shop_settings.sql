-- Shop profile settings. Run this in the Supabase SQL Editor after supabase/shop_admin.sql.
-- Shop owners can update their own shop profile and logo.
-- Shop admins are not granted update access.
-- Platform admins keep the existing shop update and logo policies.
-- Slug, id, active, and created_at stay fixed unless the caller is a platform admin.
-- Catalogue policies are not changed.

create or replace function public.is_shop_owner(target_shop_id uuid)
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
      and role = 'owner'
  );
$$;

revoke all on function public.is_shop_owner(uuid) from public, anon;
grant execute on function public.is_shop_owner(uuid) to authenticated;

create or replace function public.shop_logo_owner(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (storage.foldername(object_name))[1] = 'shops'
    and (storage.foldername(object_name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and public.is_shop_owner(((storage.foldername(object_name))[2])::uuid);
$$;

revoke all on function public.shop_logo_owner(text) from public, anon;
grant execute on function public.shop_logo_owner(text) to authenticated;

create or replace function public.protect_shop_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.slug is distinct from old.slug
    or new.active is distinct from old.active
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Shop identity fields cannot be changed here';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_shop_identity() from public, anon;

drop trigger if exists shops_protect_identity on public.shops;
create trigger shops_protect_identity
before update on public.shops
for each row execute function public.protect_shop_identity();

grant update on table public.shops to authenticated;

drop policy if exists "Shop owners can update their shop" on public.shops;
create policy "Shop owners can update their shop"
on public.shops
for update
to authenticated
using (public.is_shop_owner(id))
with check (public.is_shop_owner(id));

drop policy if exists "Shop owners can upload shop logos" on storage.objects;
create policy "Shop owners can upload shop logos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'shop-logos'
  and public.shop_logo_owner(name)
);

drop policy if exists "Shop owners can update shop logos" on storage.objects;
create policy "Shop owners can update shop logos"
on storage.objects
for update
to authenticated
using (bucket_id = 'shop-logos' and public.shop_logo_owner(name))
with check (bucket_id = 'shop-logos' and public.shop_logo_owner(name));

drop policy if exists "Shop owners can delete shop logos" on storage.objects;
create policy "Shop owners can delete shop logos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'shop-logos' and public.shop_logo_owner(name));
