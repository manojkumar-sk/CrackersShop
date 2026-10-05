export type HeroBanner = {
  id: string;
  imageUrl: string;
  alt: string;
  title: string;
  caption: string;
};

/**
 * Storefront hero banners. A future admin screen can replace this
 * function with shop banner records that use the same shape.
 */
export function getHeroBanners(): HeroBanner[] {
  return [
    {
      id: "festival-night",
      imageUrl: "/banners/festival-night.svg",
      alt: "Festival night banner with gold sparks on a dark ground",
      title: "Festival night",
      caption: "From the first sparkler to the last gift box.",
    },
    {
      id: "family-boxes",
      imageUrl: "/banners/family-boxes.svg",
      alt: "Family gift box banner in saffron and gold",
      title: "Family boxes",
      caption: "Mixed packs for a home celebration.",
    },
    {
      id: "shelf-prices",
      imageUrl: "/banners/shelf-prices.svg",
      alt: "Shelf prices banner showing marked and selling prices",
      title: "Plain prices",
      caption: "The marked price sits beside what you pay.",
    },
  ];
}
