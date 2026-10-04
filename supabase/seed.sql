-- Run after supabase/schema.sql.
-- The first paragraph of a product description is the card summary.
-- The paragraph after the blank line is the product detail copy.
-- created_at order is the featured order: the first eight products, then the rest.

insert into public.categories (
  id, name, slug, description, image_url, is_active, created_at
) values
  (
    'a1000000-0000-4000-8000-000000000001',
    'Sparklers',
    'sparklers',
    'Handheld lights for the opening minutes.',
    null,
    true,
    '2026-01-01 00:00:00+00'
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'Flower Pots',
    'flower-pots',
    'Ground fountains with an upward spray.',
    null,
    true,
    '2026-01-01 00:01:00+00'
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'Chakras',
    'chakras',
    'Wheels that spin in a bright ring.',
    null,
    true,
    '2026-01-01 00:02:00+00'
  ),
  (
    'a1000000-0000-4000-8000-000000000004',
    'Rockets',
    'rockets',
    'Sky shots with a short trail.',
    null,
    true,
    '2026-01-01 00:03:00+00'
  ),
  (
    'a1000000-0000-4000-8000-000000000005',
    'Fancy Crackers',
    'fancy-crackers',
    'Colour pieces for the middle of the show.',
    null,
    true,
    '2026-01-01 00:04:00+00'
  ),
  (
    'a1000000-0000-4000-8000-000000000006',
    'Sound Crackers',
    'sound-crackers',
    'Louder ground pieces for an open space.',
    null,
    true,
    '2026-01-01 00:05:00+00'
  ),
  (
    'a1000000-0000-4000-8000-000000000007',
    'Gift Boxes',
    'gift-boxes',
    'Mixed packs for families and visits.',
    null,
    true,
    '2026-01-01 00:06:00+00'
  ),
  (
    'a1000000-0000-4000-8000-000000000008',
    'Kids Special',
    'kids-special',
    'Milder sparklers for children, with an adult nearby.',
    null,
    true,
    '2026-01-01 00:07:00+00'
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  is_active = excluded.is_active;

insert into public.products (
  id,
  category_id,
  name,
  slug,
  description,
  mrp,
  selling_price,
  discount_percentage,
  stock_quantity,
  image_url,
  badge,
  is_active,
  created_at
) values
  (
    'b1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    '10 inch gold sparklers',
    'gold-sparklers',
    $copy$A box of handheld sparklers for the first round.

A box of ten-inch gold sparklers for the opening minutes of a home celebration. Light them in a clear space, with an adult holding the stick.$copy$,
    180,
    140,
    22,
    20,
    null,
    'Popular',
    true,
    '2026-01-02 00:01:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000002',
    'Colour flower pot',
    'colour-flower-pot',
    $copy$One ground fountain with a steady colour spray.

A single ground flower pot that opens upward in a steady colour spray. Set it on flat, open ground away from walls and fabric.$copy$,
    500,
    350,
    30,
    20,
    null,
    'Best Seller',
    true,
    '2026-01-02 00:02:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000003',
    'Deluxe ground chakra',
    'deluxe-ground-chakra',
    $copy$A single wheel for a clear patch of ground.

One deluxe ground chakra that spins in a bright ring. It needs a flat, clear patch with nothing loose nearby.$copy$,
    260,
    210,
    19,
    20,
    null,
    null,
    true,
    '2026-01-02 00:03:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000004',
    'a1000000-0000-4000-8000-000000000004',
    'Whistling rocket',
    'whistling-rocket',
    $copy$One rocket with a plain launch stick.

A single whistling rocket packed with a plain launch stick. Point it upward in an open area, well clear of roofs and trees.$copy$,
    120,
    90,
    25,
    20,
    null,
    'Popular',
    true,
    '2026-01-02 00:04:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000005',
    'a1000000-0000-4000-8000-000000000005',
    'Peacock fancy shot',
    'peacock-fancy',
    $copy$A colour piece for the middle of the evening.

A peacock fancy shot for the middle of the show, with a colour burst rather than a long ground spin. Place it upright on open ground.$copy$,
    860,
    650,
    24,
    20,
    null,
    'Best Seller',
    true,
    '2026-01-02 00:05:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000006',
    'a1000000-0000-4000-8000-000000000006',
    'Bijili roll',
    'bijili-roll',
    $copy$A small roll of ground sound crackers.

A small bijili roll of ground sound crackers. Use it outdoors, away from people, animals, and anything that can catch.$copy$,
    100,
    80,
    20,
    20,
    null,
    null,
    true,
    '2026-01-02 00:06:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000007',
    'a1000000-0000-4000-8000-000000000007',
    'Family gift box',
    'family-gift-box',
    $copy$A mixed box of sparklers, pots, and chakras.

A mixed family box with sparklers, a flower pot, and chakras packed together. The pieces stay separated inside the box.$copy$,
    2500,
    1990,
    20,
    20,
    null,
    null,
    true,
    '2026-01-02 00:07:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000008',
    'a1000000-0000-4000-8000-000000000008',
    'Kids sparkler set',
    'kids-sparkler-set',
    $copy$Shorter sparklers for children, used with an adult.

A set of shorter sparklers meant for children to hold with an adult. It does not include ground pieces or rockets.$copy$,
    220,
    175,
    20,
    20,
    null,
    null,
    true,
    '2026-01-02 00:08:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000009',
    'a1000000-0000-4000-8000-000000000001',
    'Colour sparkler 7 inch',
    'colour-sparkler-7',
    $copy$Shorter colour sparklers for a smaller circle.

Seven-inch colour sparklers in one sleeve. A shorter stick for children to watch, still used with an adult nearby.$copy$,
    120,
    95,
    21,
    20,
    null,
    null,
    true,
    '2026-01-02 00:09:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000010',
    'a1000000-0000-4000-8000-000000000002',
    'Red flower pot',
    'red-flower-pot',
    $copy$A smaller red fountain for a courtyard.

A compact red flower pot for a courtyard or terrace. One piece, with a short burn and a steady upward spray.$copy$,
    320,
    250,
    22,
    20,
    null,
    null,
    true,
    '2026-01-02 00:10:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000011',
    'a1000000-0000-4000-8000-000000000003',
    'Ground chakra special',
    'ground-chakra-special',
    $copy$A smaller wheel for a short spin.

A special ground chakra with a shorter spin than the deluxe wheel. Useful when the open space is modest.$copy$,
    180,
    145,
    19,
    20,
    null,
    null,
    true,
    '2026-01-02 00:11:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000012',
    'a1000000-0000-4000-8000-000000000004',
    'Colour rocket',
    'colour-rocket',
    $copy$A colour burst at the end of a short trail.

One colour rocket with a short trail and a burst at the top. It is packed as a single piece with a launch stick.$copy$,
    160,
    130,
    19,
    20,
    null,
    null,
    true,
    '2026-01-02 00:12:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000013',
    'a1000000-0000-4000-8000-000000000005',
    'Lotus fancy',
    'lotus-fancy',
    $copy$A standing colour piece with a wide finish.

A lotus fancy cracker that finishes in a wide colour spread. One standing piece for a clear patch in the courtyard.$copy$,
    740,
    590,
    20,
    20,
    null,
    null,
    true,
    '2026-01-02 00:13:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000014',
    'a1000000-0000-4000-8000-000000000006',
    'Electric cracker',
    'electric-cracker',
    $copy$A short string of louder ground crackers.

A short string of electric crackers for an open yard. Lay the string out fully before lighting the end.$copy$,
    140,
    110,
    21,
    20,
    null,
    null,
    true,
    '2026-01-02 00:14:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000015',
    'a1000000-0000-4000-8000-000000000007',
    'Return gift box',
    'return-gift-box',
    $copy$A smaller mixed box for guests to take home.

A smaller return-gift box with a few sparklers and one ground piece. Sized for a guest to carry, not for a full evening.$copy$,
    900,
    750,
    17,
    20,
    null,
    null,
    true,
    '2026-01-02 00:15:00+00'
  ),
  (
    'b1000000-0000-4000-8000-000000000016',
    'a1000000-0000-4000-8000-000000000008',
    'Kids flower pot',
    'kids-flower-pot',
    $copy$A small ground fountain for a supervised show.

A small flower pot from the kids range. An adult should place and light it, with children watching from a distance.$copy$,
    150,
    120,
    20,
    20,
    null,
    null,
    true,
    '2026-01-02 00:16:00+00'
  )
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  mrp = excluded.mrp,
  selling_price = excluded.selling_price,
  discount_percentage = excluded.discount_percentage,
  stock_quantity = excluded.stock_quantity,
  image_url = excluded.image_url,
  badge = excluded.badge,
  is_active = excluded.is_active;
