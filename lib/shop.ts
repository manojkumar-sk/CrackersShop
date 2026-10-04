import { cache } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveHostname } from "@/lib/shop-host";
import { loadShopPhones, type ShopPhone } from "@/lib/shop-phones";
import { getSupabase } from "@/lib/supabase";
import { createAuthClient } from "@/lib/supabase/server";

export type ShopRole = "owner" | "admin";

export type PublicShop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  phones: ShopPhone[];
  address: string | null;
  email: string | null;
  businessHours: string | null;
};

export class ShopUnavailableError extends Error {
  constructor() {
    super("Shop unavailable");
    this.name = "ShopUnavailableError";
  }
}

export type CurrentShop = {
  id: string;
  name: string;
  slug: string;
  active: true;
  role: ShopRole;
};

export type CurrentShopResult =
  | {
      status: "ok";
      shop: CurrentShop;
      supabase: SupabaseClient;
    }
  | { status: "unavailable" | "anonymous" | "forbidden" | "no-shop" | "many-shops" };

type ShopRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

type PublicShopRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  whatsapp_number: string | null;
  phone_number: string | null;
  address: string | null;
  email: string | null;
  business_hours: string | null;
};

const publicShopColumns =
  "id, name, slug, description, logo_url, whatsapp_number, phone_number, address, email, business_hours";

function textOrNull(value: string | null) {
  const text = value?.trim() ?? "";
  return text.length > 0 ? text : null;
}

const phonePattern = /^[0-9]{10,15}$/;

function legacyShopPhones(row: PublicShopRow): ShopPhone[] {
  const phones: ShopPhone[] = [];
  const whatsapp = row.whatsapp_number?.trim() ?? "";
  const phone = row.phone_number?.trim() ?? "";

  if (phonePattern.test(whatsapp)) {
    phones.push({ phoneNumber: whatsapp, isWhatsapp: true, isPrimary: true });
  }

  if (phonePattern.test(phone) && phone !== whatsapp) {
    phones.push({ phoneNumber: phone, isWhatsapp: false, isPrimary: false });
  }

  return phones;
}

function toPublicShop(row: PublicShopRow, phones: ShopPhone[]): PublicShop {
  return {
    id: row.id,
    name: row.name.trim(),
    slug: row.slug,
    description: textOrNull(row.description),
    logoUrl: textOrNull(row.logo_url),
    phones,
    address: textOrNull(row.address),
    email: textOrNull(row.email),
    businessHours: textOrNull(row.business_hours),
  };
}

type MembershipRow = {
  role: string;
  shop_id: string;
  shops: ShopRow | ShopRow[] | null;
};

function oneShop(value: ShopRow | ShopRow[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function membershipShop(row: MembershipRow): CurrentShop | null {
  const shop = oneShop(row.shops);

  if (!shop || !shop.active || shop.id !== row.shop_id) {
    return null;
  }

  if (row.role !== "owner" && row.role !== "admin") {
    return null;
  }

  return {
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    active: true,
    role: row.role,
  };
}

export function currentShopMessage(
  status: Exclude<CurrentShopResult["status"], "ok">,
) {
  if (status === "no-shop") {
    return "This account is not a member of an active shop.";
  }

  if (status === "many-shops") {
    return "This account belongs to more than one shop.";
  }

  if (status === "forbidden" || status === "anonymous") {
    return "Please log in as an admin and try again.";
  }

  return "We could not verify the shop just now. Please try again.";
}

export const getCurrentShop = cache(async (): Promise<CurrentShopResult> => {
  await connection();

  try {
    const supabase = await createAuthClient();

    if (!supabase) {
      return { status: "unavailable" };
    }

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || typeof userId !== "string" || userId.length === 0) {
      return { status: "anonymous" };
    }

    // Catalogue scope comes from this user's membership, not the hostname
    // and not a browser-supplied shop id.
    const membership = await supabase
      .from("shop_members")
      .select("role, shop_id, shops!inner(id, name, slug, active)")
      .eq("user_id", userId)
      .eq("shops.active", true);

    if (membership.error) {
      console.error("Shop membership lookup failed:", membership.error.message);
      return { status: "unavailable" };
    }

    const shops = ((membership.data ?? []) as MembershipRow[]).flatMap((row) => {
      const shop = membershipShop(row);
      return shop ? [shop] : [];
    });

    if (shops.length === 0) {
      return { status: "no-shop" };
    }

    if (shops.length > 1) {
      return { status: "many-shops" };
    }

    return { status: "ok", shop: shops[0], supabase };
  } catch {
    console.error("Current shop lookup failed");
    return { status: "unavailable" };
  }
});

export const getStorefrontHost = cache(async () => {
  await connection();
  const headerStore = await headers();
  const hostname = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  return resolveHostname(hostname);
});

export async function getShopFromHostname(
  hostname: string,
): Promise<PublicShop | null> {
  const resolved = resolveHostname(hostname);

  if (resolved.kind !== "tenant") {
    return null;
  }

  const slug = resolved.slug;

  const supabase = getSupabase();

  if (!supabase) {
    throw new ShopUnavailableError();
  }

  const { data, error } = await supabase
    .from("shops")
    .select(publicShopColumns)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error("Public shop lookup failed:", error.message);
    throw new ShopUnavailableError();
  }

  if (!data) {
    return null;
  }

  const phoneResult = await loadShopPhones(supabase, data.id);
  const row = data as PublicShopRow;
  const phones = phoneResult.ok
    ? phoneResult.phones
    : phoneResult.missingTable
      ? legacyShopPhones(row)
      : null;

  if (!phones) {
    throw new ShopUnavailableError();
  }

  const shop = toPublicShop(row, phones);

  if (shop.slug !== slug) {
    return null;
  }

  return shop;
}

export const getPublicShop = cache(async (): Promise<PublicShop | null> => {
  const host = await getStorefrontHost();

  if (host.kind !== "tenant") {
    return null;
  }

  const headerStore = await headers();
  const hostname = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  return getShopFromHostname(hostname);
});
