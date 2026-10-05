-- Optional map fields on the existing shop row.
-- Run this in the Supabase SQL Editor. It does not create a second settings table.
-- Leave the values empty until the shop has a real address or map link.

alter table public.shops
  add column if not exists maps_url text,
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6);

alter table public.shops
  drop constraint if exists shops_latitude_range;

alter table public.shops
  add constraint shops_latitude_range
  check (latitude is null or (latitude >= -90 and latitude <= 90));

alter table public.shops
  drop constraint if exists shops_longitude_range;

alter table public.shops
  add constraint shops_longitude_range
  check (longitude is null or (longitude >= -180 and longitude <= 180));

alter table public.shops
  drop constraint if exists shops_map_pair;

alter table public.shops
  add constraint shops_map_pair
  check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  );
