import { cache } from "react";
import { connection } from "next/server";
import { getCurrentShop } from "@/lib/shop";
import { createAuthClient } from "@/lib/supabase/server";

export class AdminUnavailableError extends Error {
  constructor() {
    super("Admin unavailable");
    this.name = "AdminUnavailableError";
  }
}

export type AdminSession =
  | { status: "unavailable" }
  | { status: "anonymous" }
  | { status: "forbidden" }
  | { status: "admin"; email: string; platform: boolean };

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  mrp: number;
  price: number;
  discount: number;
  stock: number;
  active: boolean;
  imageUrl: string | null;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  imageUrl: string | null;
  productCount: number;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  mrp: number | string;
  selling_price: number | string;
  discount_percentage: number | string;
  stock_quantity: number | string;
  is_active: boolean;
  image_url: string | null;
  categories: { name: string } | { name: string }[] | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  image_url: string | null;
  products: { count: number }[] | null;
};

function amount(value: number | string) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function unavailable(scope: string, error: { message: string }): never {
  console.error(`Admin ${scope} failed:`, error.message);
  throw new AdminUnavailableError();
}

export const getAdminSession = cache(async (): Promise<AdminSession> => {
  await connection();

  try {
    const supabase = await createAuthClient();

    if (!supabase) {
      return { status: "unavailable" };
    }

    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      return { status: "anonymous" };
    }

    const role = await supabase.rpc("is_admin");

    if (role.error) {
      console.error("Admin role check failed:", role.error.message);
      return { status: "unavailable" };
    }

    const platform = role.data === true;

    if (!platform) {
      const membership = await supabase.from("shop_members").select("shop_id").limit(1);

      if (membership.error) {
        console.error("Shop membership check failed:", membership.error.message);
        return { status: "unavailable" };
      }

      if ((membership.data?.length ?? 0) === 0) {
        return { status: "forbidden" };
      }
    }

    const email = data.claims.email;

    return {
      status: "admin",
      platform,
      email: typeof email === "string" && email.length > 0 ? email : "Admin account",
    };
  } catch {
    console.error("Admin session check failed");
    return { status: "unavailable" };
  }
});

export async function requireAdminClient() {
  const session = await getAdminSession();

  if (session.status !== "admin") {
    throw new AdminUnavailableError();
  }

  const supabase = await createAuthClient();

  if (!supabase) {
    throw new AdminUnavailableError();
  }

  return supabase;
}

async function currentCatalogue() {
  const current = await getCurrentShop();

  if (current.status !== "ok") {
    throw new AdminUnavailableError();
  }

  return current;
}

export async function getAdminSummary() {
  const { supabase, shop } = await currentCatalogue();
  const [products, categories] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shop.id),
    supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shop.id),
  ]);

  if (products.error) {
    unavailable("product count", products.error);
  }

  if (categories.error) {
    unavailable("category count", categories.error);
  }

  return {
    productCount: products.count ?? 0,
    categoryCount: categories.count ?? 0,
  };
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const { supabase, shop } = await currentCatalogue();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, category_id, mrp, selling_price, discount_percentage, stock_quantity, is_active, image_url, categories!products_category_id_fkey(name)",
    )
    .eq("shop_id", shop.id)
    .order("name", { ascending: true });

  if (error) {
    unavailable("product list", error);
  }

  return ((data ?? []) as ProductRow[]).map(toAdminProduct);
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  const { supabase, shop } = await currentCatalogue();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, category_id, mrp, selling_price, discount_percentage, stock_quantity, is_active, image_url, categories!products_category_id_fkey(name)",
    )
    .eq("id", id)
    .eq("shop_id", shop.id)
    .maybeSingle();

  if (error) {
    unavailable("product", error);
  }

  if (!data) {
    return null;
  }

  return toAdminProduct(data as ProductRow);
}

function toAdminProduct(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    categoryId: row.category_id,
    categoryName: one(row.categories)?.name ?? "Uncategorised",
    mrp: amount(row.mrp),
    price: amount(row.selling_price),
    discount: amount(row.discount_percentage),
    stock: amount(row.stock_quantity),
    active: row.is_active,
    imageUrl: row.image_url?.trim() || null,
  };
}

const categoryColumns =
  "id, name, slug, description, image_url, is_active, products!products_category_id_fkey(count)";

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const { supabase, shop } = await currentCatalogue();
  const { data, error } = await supabase
    .from("categories")
    .select(categoryColumns)
    .eq("shop_id", shop.id)
    .order("name", { ascending: true });

  if (error) {
    unavailable("category list", error);
  }

  return ((data ?? []) as CategoryRow[]).map(toAdminCategory);
}

export async function getAdminCategory(id: string): Promise<AdminCategory | null> {
  const { supabase, shop } = await currentCatalogue();
  const { data, error } = await supabase
    .from("categories")
    .select(categoryColumns)
    .eq("id", id)
    .eq("shop_id", shop.id)
    .maybeSingle();

  if (error) {
    unavailable("category", error);
  }

  if (!data) {
    return null;
  }

  return toAdminCategory(data as CategoryRow);
}

function toAdminCategory(row: CategoryRow): AdminCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    active: row.is_active,
    imageUrl: row.image_url?.trim() || null,
    productCount: one(row.products)?.count ?? 0,
  };
}
