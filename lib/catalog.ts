import { cache } from "react";
import { connection } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type {
  CatalogTone,
  Category,
  Product,
  ProductBadge,
} from "@/types/catalog";

export class CatalogUnavailableError extends Error {
  constructor() {
    super("Catalog unavailable");
    this.name = "CatalogUnavailableError";
  }
}

export const featuredProductLimit = 8;

const toneByCategorySlug: Record<string, CatalogTone> = {
  sparklers: "gold",
  "flower-pots": "ember",
  chakras: "saffron",
  rockets: "wine",
  "fancy-crackers": "sand",
  "sound-crackers": "dusk",
  "gift-boxes": "pine",
  "kids-special": "clay",
};

const productColumns =
  "slug, name, description, mrp, selling_price, badge, image_url, categories!products_category_id_fkey!inner(slug, name)";

type CategoryRow = {
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  products: { count: number }[] | null;
};

type ProductRow = {
  slug: string;
  name: string;
  description: string;
  mrp: number | string;
  selling_price: number | string;
  badge: string | null;
  image_url: string | null;
  categories:
    | { slug: string; name: string }
    | { slug: string; name: string }[]
    | null;
};

function toneFor(slug: string): CatalogTone {
  return toneByCategorySlug[slug] ?? "sand";
}

function splitCopy(value: string) {
  const [lead, ...rest] = value.split(/\n\n+/);
  const summary = lead.trim();
  const detail = rest.join("\n\n").trim();

  return {
    summary,
    description: detail.length > 0 ? detail : summary,
  };
}

function money(value: number | string) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function badgeOf(value: string | null): ProductBadge | undefined {
  if (value === "Popular" || value === "Best Seller") {
    return value;
  }

  return undefined;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function readCount(value: { count: number }[] | null) {
  const row = one(value);
  return row && typeof row.count === "number" ? row.count : 0;
}

async function catalogClient() {
  await connection();

  const supabase = getSupabase();

  if (!supabase) {
    throw new CatalogUnavailableError();
  }

  return supabase;
}

function unavailable(error: { message: string }): never {
  console.error("Catalog query failed:", error.message);
  throw new CatalogUnavailableError();
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.slug,
    name: row.name,
    summary: row.description.trim(),
    tone: toneFor(row.slug),
    productCount: readCount(row.products),
    imageUrl: row.image_url?.trim() || undefined,
  };
}

function toProduct(row: ProductRow): Product | null {
  const category = one(row.categories);

  if (!category) {
    return null;
  }

  const copy = splitCopy(row.description);

  return {
    id: row.slug,
    name: row.name,
    summary: copy.summary,
    description: copy.description,
    categoryName: category.name,
    tone: toneFor(category.slug),
    mrp: money(row.mrp),
    price: money(row.selling_price),
    badge: badgeOf(row.badge),
    imageUrl: row.image_url?.trim() || undefined,
  };
}

function productsFrom(rows: ProductRow[]) {
  return rows.flatMap((row) => {
    const product = toProduct(row);
    return product ? [product] : [];
  });
}

export const getActiveCategories = cache(async (shopId: string): Promise<Category[]> => {
  const supabase = await catalogClient();
  const { data, error } = await supabase
    .from("categories")
    .select(
      "slug, name, description, image_url, products!products_category_id_fkey(count)",
    )
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    unavailable(error);
  }

  return ((data ?? []) as CategoryRow[]).map(toCategory);
});

export const getActiveProducts = cache(async (shopId: string): Promise<Product[]> => {
  const supabase = await catalogClient();
  const { data, error } = await supabase
    .from("products")
    .select(productColumns)
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    unavailable(error);
  }

  return productsFrom((data ?? []) as ProductRow[]);
});

export const getFeaturedProducts = cache(async (shopId: string): Promise<Product[]> => {
  const products = await getActiveProducts(shopId);
  return products.slice(0, featuredProductLimit);
});

export const getProductBySlug = cache(
  async (shopId: string, slug: string): Promise<Product | null> => {
    const supabase = await catalogClient();
    const { data, error } = await supabase
      .from("products")
      .select(productColumns)
      .eq("shop_id", shopId)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      unavailable(error);
    }

    if (!data) {
      return null;
    }

    return toProduct(data as ProductRow);
  },
);

export const getCategoryBySlug = cache(
  async (shopId: string, slug: string): Promise<Category | null> => {
    const supabase = await catalogClient();
    const { data, error } = await supabase
      .from("categories")
      .select(
        "slug, name, description, image_url, products!products_category_id_fkey(count)",
      )
      .eq("shop_id", shopId)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      unavailable(error);
    }

    if (!data) {
      return null;
    }

    return toCategory(data as CategoryRow);
  },
);

export const getProductsByCategory = cache(
  async (shopId: string, slug: string): Promise<Product[]> => {
    const supabase = await catalogClient();
    const { data, error } = await supabase
      .from("products")
      .select(productColumns)
      .eq("shop_id", shopId)
      .eq("is_active", true)
      .eq("categories.shop_id", shopId)
      .eq("categories.slug", slug)
      .order("created_at", { ascending: true });

    if (error) {
      unavailable(error);
    }

    return productsFrom((data ?? []) as ProductRow[]);
  },
);
