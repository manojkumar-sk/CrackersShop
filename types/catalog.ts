export type CatalogTone =
  | "ember"
  | "sand"
  | "pine"
  | "clay"
  | "wine"
  | "gold"
  | "saffron"
  | "dusk";

export type ProductBadge = "Popular" | "Best Seller";

export type Category = {
  id: string;
  name: string;
  summary: string;
  tone: CatalogTone;
  productCount?: number;
  imageUrl?: string;
};

export type Product = {
  id: string;
  name: string;
  summary: string;
  description: string;
  categoryName: string;
  tone: CatalogTone;
  mrp: number;
  price: number;
  badge?: ProductBadge;
  imageUrl?: string;
};
