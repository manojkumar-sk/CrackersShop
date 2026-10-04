import type { Category, Product } from "@/types/catalog";

/**
 * Reference copy of the original shelf. The live storefront reads Supabase.
 * supabase/seed.sql loads this catalogue.
 * Product and category ids are the URL slugs.
 */
export const categories: Category[] = [
  {
    id: "sparklers",
    name: "Sparklers",
    summary: "Handheld lights for the opening minutes.",
    tone: "gold",
  },
  {
    id: "flower-pots",
    name: "Flower Pots",
    summary: "Ground fountains with an upward spray.",
    tone: "ember",
  },
  {
    id: "chakras",
    name: "Chakras",
    summary: "Wheels that spin in a bright ring.",
    tone: "saffron",
  },
  {
    id: "rockets",
    name: "Rockets",
    summary: "Sky shots with a short trail.",
    tone: "wine",
  },
  {
    id: "fancy-crackers",
    name: "Fancy Crackers",
    summary: "Colour pieces for the middle of the show.",
    tone: "sand",
  },
  {
    id: "sound-crackers",
    name: "Sound Crackers",
    summary: "Louder ground pieces for an open space.",
    tone: "dusk",
  },
  {
    id: "gift-boxes",
    name: "Gift Boxes",
    summary: "Mixed packs for families and visits.",
    tone: "pine",
  },
  {
    id: "kids-special",
    name: "Kids Special",
    summary: "Milder sparklers for children, with an adult nearby.",
    tone: "clay",
  },
];

export const products: Product[] = [
  {
    id: "gold-sparklers",
    name: "10 inch gold sparklers",
    summary: "A box of handheld sparklers for the first round.",
    description:
      "A box of ten-inch gold sparklers for the opening minutes of a home celebration. Light them in a clear space, with an adult holding the stick.",
    categoryName: "Sparklers",
    tone: "gold",
    mrp: 180,
    price: 140,
    badge: "Popular",
  },
  {
    id: "colour-sparkler-7",
    name: "Colour sparkler 7 inch",
    summary: "Shorter colour sparklers for a smaller circle.",
    description:
      "Seven-inch colour sparklers in one sleeve. A shorter stick for children to watch, still used with an adult nearby.",
    categoryName: "Sparklers",
    tone: "gold",
    mrp: 120,
    price: 95,
  },
  {
    id: "colour-flower-pot",
    name: "Colour flower pot",
    summary: "One ground fountain with a steady colour spray.",
    description:
      "A single ground flower pot that opens upward in a steady colour spray. Set it on flat, open ground away from walls and fabric.",
    categoryName: "Flower Pots",
    tone: "ember",
    mrp: 500,
    price: 350,
    badge: "Best Seller",
  },
  {
    id: "red-flower-pot",
    name: "Red flower pot",
    summary: "A smaller red fountain for a courtyard.",
    description:
      "A compact red flower pot for a courtyard or terrace. One piece, with a short burn and a steady upward spray.",
    categoryName: "Flower Pots",
    tone: "ember",
    mrp: 320,
    price: 250,
  },
  {
    id: "deluxe-ground-chakra",
    name: "Deluxe ground chakra",
    summary: "A single wheel for a clear patch of ground.",
    description:
      "One deluxe ground chakra that spins in a bright ring. It needs a flat, clear patch with nothing loose nearby.",
    categoryName: "Chakras",
    tone: "saffron",
    mrp: 260,
    price: 210,
  },
  {
    id: "ground-chakra-special",
    name: "Ground chakra special",
    summary: "A smaller wheel for a short spin.",
    description:
      "A special ground chakra with a shorter spin than the deluxe wheel. Useful when the open space is modest.",
    categoryName: "Chakras",
    tone: "saffron",
    mrp: 180,
    price: 145,
  },
  {
    id: "whistling-rocket",
    name: "Whistling rocket",
    summary: "One rocket with a plain launch stick.",
    description:
      "A single whistling rocket packed with a plain launch stick. Point it upward in an open area, well clear of roofs and trees.",
    categoryName: "Rockets",
    tone: "wine",
    mrp: 120,
    price: 90,
    badge: "Popular",
  },
  {
    id: "colour-rocket",
    name: "Colour rocket",
    summary: "A colour burst at the end of a short trail.",
    description:
      "One colour rocket with a short trail and a burst at the top. It is packed as a single piece with a launch stick.",
    categoryName: "Rockets",
    tone: "wine",
    mrp: 160,
    price: 130,
  },
  {
    id: "peacock-fancy",
    name: "Peacock fancy shot",
    summary: "A colour piece for the middle of the evening.",
    description:
      "A peacock fancy shot for the middle of the show, with a colour burst rather than a long ground spin. Place it upright on open ground.",
    categoryName: "Fancy Crackers",
    tone: "sand",
    mrp: 860,
    price: 650,
    badge: "Best Seller",
  },
  {
    id: "lotus-fancy",
    name: "Lotus fancy",
    summary: "A standing colour piece with a wide finish.",
    description:
      "A lotus fancy cracker that finishes in a wide colour spread. One standing piece for a clear patch in the courtyard.",
    categoryName: "Fancy Crackers",
    tone: "sand",
    mrp: 740,
    price: 590,
  },
  {
    id: "bijili-roll",
    name: "Bijili roll",
    summary: "A small roll of ground sound crackers.",
    description:
      "A small bijili roll of ground sound crackers. Use it outdoors, away from people, animals, and anything that can catch.",
    categoryName: "Sound Crackers",
    tone: "dusk",
    mrp: 100,
    price: 80,
  },
  {
    id: "electric-cracker",
    name: "Electric cracker",
    summary: "A short string of louder ground crackers.",
    description:
      "A short string of electric crackers for an open yard. Lay the string out fully before lighting the end.",
    categoryName: "Sound Crackers",
    tone: "dusk",
    mrp: 140,
    price: 110,
  },
  {
    id: "family-gift-box",
    name: "Family gift box",
    summary: "A mixed box of sparklers, pots, and chakras.",
    description:
      "A mixed family box with sparklers, a flower pot, and chakras packed together. The pieces stay separated inside the box.",
    categoryName: "Gift Boxes",
    tone: "pine",
    mrp: 2500,
    price: 1990,
  },
  {
    id: "return-gift-box",
    name: "Return gift box",
    summary: "A smaller mixed box for guests to take home.",
    description:
      "A smaller return-gift box with a few sparklers and one ground piece. Sized for a guest to carry, not for a full evening.",
    categoryName: "Gift Boxes",
    tone: "pine",
    mrp: 900,
    price: 750,
  },
  {
    id: "kids-sparkler-set",
    name: "Kids sparkler set",
    summary: "Shorter sparklers for children, used with an adult.",
    description:
      "A set of shorter sparklers meant for children to hold with an adult. It does not include ground pieces or rockets.",
    categoryName: "Kids Special",
    tone: "clay",
    mrp: 220,
    price: 175,
  },
  {
    id: "kids-flower-pot",
    name: "Kids flower pot",
    summary: "A small ground fountain for a supervised show.",
    description:
      "A small flower pot from the kids range. An adult should place and light it, with children watching from a distance.",
    categoryName: "Kids Special",
    tone: "clay",
    mrp: 150,
    price: 120,
  },
];

const featuredIds = [
  "gold-sparklers",
  "colour-flower-pot",
  "deluxe-ground-chakra",
  "whistling-rocket",
  "peacock-fancy",
  "bijili-roll",
  "family-gift-box",
  "kids-sparkler-set",
] as const;

export const featuredProducts = featuredIds.map((id) => {
  const product = products.find((item) => item.id === id);

  if (!product) {
    throw new Error(`Missing featured product: ${id}`);
  }

  return product;
});
