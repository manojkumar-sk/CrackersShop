"use server";

import { connection } from "next/server";
import { maxCartQuantity, meetsMinimumOrder, minimumOrderShortfall, minimumOrderValue } from "@/lib/cart";
import { formatInr } from "@/lib/money";
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
  lines: { slug: string; quantity: number }[],
): Promise<{ ok: true; items: CartQuote[] } | { ok: false; message: string }> {
  await connection();

  const quantities = new Map<string, number>();

  for (const line of lines) {
    if (
      !slugPattern.test(line.slug) ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > maxCartQuantity
    ) {
      continue;
    }

    quantities.set(line.slug, line.quantity);

    if (quantities.size >= 40) {
      break;
    }
  }

  const unique = [...quantities.keys()];

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

  if (items.length === unique.length) {
    const total = items.reduce(
      (sum, item) => sum + item.price * (quantities.get(item.slug) ?? 0),
      0,
    );

    if (!meetsMinimumOrder(total)) {
      return {
        ok: false,
        message: `Minimum order value is ${formatInr(minimumOrderValue)}. Add ${formatInr(minimumOrderShortfall(total))} more to place this order.`,
      };
    }
  }

  return { ok: true, items };
}
