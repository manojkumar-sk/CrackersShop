"use server";

import { connection } from "next/server";
import { getPublicShop, ShopUnavailableError } from "@/lib/shop";
import { getSupabase } from "@/lib/supabase";

export type CartQuote = {
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function quoteCart(
  slugs: string[],
): Promise<{ ok: true; items: CartQuote[] } | { ok: false; message: string }> {
  await connection();

  const unique = [...new Set(slugs.filter((slug) => slugPattern.test(slug)))].slice(0, 40);

  if (unique.length === 0) {
    return { ok: true, items: [] };
  }

  let shop;

  try {
    shop = await getPublicShop();
  } catch (error) {
    if (!(error instanceof ShopUnavailableError)) {
      throw error;
    }

    return {
      ok: false,
      message: "We could not check the latest prices. Please try again.",
    };
  }

  if (!shop) {
    return {
      ok: false,
      message: "We could not check the latest prices. Please try again.",
    };
  }

  const supabase = getSupabase();

  if (!supabase) {
    return {
      ok: false,
      message: "We could not check the latest prices. Please try again.",
    };
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      "slug, name, selling_price, image_url, categories!products_category_id_fkey!inner(slug)",
    )
    .eq("shop_id", shop.id)
    .in("slug", unique)
    .eq("is_active", true);

  if (error) {
    console.error("Cart quote failed:", error.message);
    return {
      ok: false,
      message: "We could not check the latest prices. Please try again.",
    };
  }

  const items = (data ?? []).flatMap((row) => {
    const price = Number(row.selling_price);

    if (!Number.isInteger(price) || price <= 0) {
      return [];
    }

    const imageUrl = row.image_url?.trim();

    return [
      {
        slug: row.slug,
        name: row.name,
        price,
        ...(imageUrl ? { imageUrl } : {}),
      },
    ];
  });

  return { ok: true, items };
}
