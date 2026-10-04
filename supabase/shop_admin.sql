-- Platform shop management. Run this in the Supabase SQL Editor after
-- supabase/public_shop_routing.sql.
--
-- public.admin_users / is_admin() remains the platform-admin check.
-- shop_members remains shop owner/admin membership.
-- Public catalogue policies are not changed.
-- Existing category and product policies that require is_admin() stay in place.
-- Extra shop-staff policies let a shop member manage only that shop's catalogue
-- without being a platform admin.

create or replace function public.has_shop_membership()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_members
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.has_shop_membership() from public, anon;
grant execute on function public.has_shop_membership() to authenticated;

create or replace function public.lookup_auth_user(target_email text)
returns table (id uuid, email text)
language sql
stable
security definer
set search_path = public
as $$
  select users.id, users.email::text
  from auth.users as users
  where public.is_admin()
    and lower(users.email) = lower(trim(target_email))
  limit 1;
$$;

revoke all on function public.lookup_auth_user(text) from public, anon;
grant execute on function public.lookup_auth_user(text) to authenticated;

create or replace function public.shop_member_directory(target_shop_id uuid)
returns table (
  user_id uuid,
  email text,
  role text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select members.user_id, users.email::text, members.role, members.created_at
  from public.shop_members as members
  join auth.users as users on users.id = members.user_id
  where public.is_admin()
    and members.shop_id = target_shop_id
  order by members.created_at;
$$;

revoke all on function public.shop_member_directory(uuid) from public, anon;
grant execute on function public.shop_member_directory(uuid) to authenticated;

create or replace function public.prevent_last_shop_owner_loss()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  other_owners integer;
begin
  if tg_op = 'UPDATE' and new.shop_id is distinct from old.shop_id then
    raise exception 'Shop membership cannot move between shops';
  end if;

  if tg_op = 'DELETE' and old.role is distinct from 'owner' then
    return old;
  end if;

  if tg_op = 'UPDATE' and (old.role is distinct from 'owner' or new.role = 'owner') then
    return new;
  end if;

  select count(*) into other_owners
  from public.shop_members
  where shop_id = old.shop_id
    and role = 'owner'
    and user_id <> old.user_id;

  if other_owners < 1 then
    raise exception 'Assign another owner before removing this one';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_last_shop_owner_loss() from public, anon;

drop trigger if exists shop_members_keep_owner on public.shop_members;
create trigger shop_members_keep_owner
before update or delete on public.shop_members
for each row execute function public.prevent_last_shop_owner_loss();

grant insert, update on table public.shops to authenticated;
grant insert, update, delete on table public.shop_members to authenticated;

drop policy if exists "Platform admins can read shops" on public.shops;
create policy "Platform admins can read shops"
on public.shops
for select
to authenticated
using (public.is_admin());

drop policy if exists "Platform admins can insert shops" on public.shops;
create policy "Platform admins can insert shops"
on public.shops
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Platform admins can update shops" on public.shops;
create policy "Platform admins can update shops"
on public.shops
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Platform admins can read shop members" on public.shop_members;
create policy "Platform admins can read shop members"
on public.shop_members
for select
to authenticated
using (public.is_admin());

drop policy if exists "Platform admins can insert shop members" on public.shop_members;
create policy "Platform admins can insert shop members"
on public.shop_members
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Platform admins can update shop members" on public.shop_members;
create policy "Platform admins can update shop members"
on public.shop_members
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Platform admins can delete shop members" on public.shop_members;
create policy "Platform admins can delete shop members"
on public.shop_members
for delete
to authenticated
using (public.is_admin());

-- Shop staff catalogue access. These sit beside the existing
-- is_admin() and is_shop_member() policies. They do not grant another shop.
drop policy if exists "Catalogue staff can read categories" on public.categories;
create policy "Catalogue staff can read categories"
on public.categories
for select
to authenticated
using (public.is_shop_member(shop_id));

drop policy if exists "Catalogue staff can insert categories" on public.categories;
create policy "Catalogue staff can insert categories"
on public.categories
for insert
to authenticated
with check (public.is_shop_member(shop_id));

drop policy if exists "Catalogue staff can update categories" on public.categories;
create policy "Catalogue staff can update categories"
on public.categories
for update
to authenticated
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

drop policy if exists "Catalogue staff can delete categories" on public.categories;
create policy "Catalogue staff can delete categories"
on public.categories
for delete
to authenticated
using (public.is_shop_member(shop_id));

drop policy if exists "Catalogue staff can read products" on public.products;
create policy "Catalogue staff can read products"
on public.products
for select
to authenticated
using (public.is_shop_member(shop_id));

drop policy if exists "Catalogue staff can insert products" on public.products;
create policy "Catalogue staff can insert products"
on public.products
for insert
to authenticated
with check (public.is_shop_member(shop_id));

drop policy if exists "Catalogue staff can update products" on public.products;
create policy "Catalogue staff can update products"
on public.products
for update
to authenticated
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

drop policy if exists "Catalogue staff can delete products" on public.products;
create policy "Catalogue staff can delete products"
on public.products
for delete
to authenticated
using (public.is_shop_member(shop_id));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'shop-logos',
  'shop-logos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read shop logos" on storage.objects;
create policy "Public can read shop logos"
on storage.objects
for select
to public
using (bucket_id = 'shop-logos');

drop policy if exists "Platform admins can upload shop logos" on storage.objects;
create policy "Platform admins can upload shop logos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'shop-logos' and public.is_admin());

drop policy if exists "Platform admins can update shop logos" on storage.objects;
create policy "Platform admins can update shop logos"
on storage.objects
for update
to authenticated
using (bucket_id = 'shop-logos' and public.is_admin())
with check (bucket_id = 'shop-logos' and public.is_admin());

drop policy if exists "Platform admins can delete shop logos" on storage.objects;
create policy "Platform admins can delete shop logos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'shop-logos' and public.is_admin());

drop policy if exists "Shop staff can upload product images" on storage.objects;
create policy "Shop staff can upload product images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images' and public.has_shop_membership());

drop policy if exists "Shop staff can update product images" on storage.objects;
create policy "Shop staff can update product images"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images' and public.has_shop_membership())
with check (bucket_id = 'product-images' and public.has_shop_membership());

drop policy if exists "Shop staff can delete product images" on storage.objects;
create policy "Shop staff can delete product images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images' and public.has_shop_membership());

drop policy if exists "Shop staff can upload category images" on storage.objects;
create policy "Shop staff can upload category images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'category-images' and public.has_shop_membership());

drop policy if exists "Shop staff can update category images" on storage.objects;
create policy "Shop staff can update category images"
on storage.objects
for update
to authenticated
using (bucket_id = 'category-images' and public.has_shop_membership())
with check (bucket_id = 'category-images' and public.has_shop_membership());

drop policy if exists "Shop staff can delete category images" on storage.objects;
create policy "Shop staff can delete category images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'category-images' and public.has_shop_membership());
