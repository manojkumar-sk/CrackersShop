import { cache } from "react";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadShopPhones, type ShopPhone } from "@/lib/shop-phones";
import { getSupabase } from "@/lib/supabase";
import { createAuthClient } from "@/lib/supabase/server";

/** The only shop this application operates. Multi-tenant tables stay in place. */
export const singleShopSlug = "cracker-store";

export type ShopRole = "owner" | "admin";

/** Platform admins and the Cracker Store owner can manage staff. Catalogue admins cannot. */
export function canManageShopAdmins(input: { platform: boolean; role: ShopRole | null }) {
  return input.platform || input.role === "owner";
}

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
  mapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
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
  | { status: "unavailable" | "anonymous" | "forbidden" | "no-shop" };

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
  maps_url?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

const publicShopColumns =
  "id, name, slug, description, logo_url, whatsapp_number, phone_number, address, email, business_hours";

const publicShopMapColumns = `${publicShopColumns}, maps_url, latitude, longitude`;

function coordinate(value: number | string | null | undefined) {
  if (value == null || value === "") {
    return null;
  }

  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

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
    mapsUrl: textOrNull(row.maps_url ?? null),
    latitude: coordinate(row.latitude),
    longitude: coordinate(row.longitude),
  };
}

function shopRole(role: string | null | undefined): ShopRole | null {
  if (role === "owner" || role === "admin") {
    return role;
  }

  return null;
}

export function currentShopMessage(
  status: Exclude<CurrentShopResult["status"], "ok">,
) {
  if (status === "no-shop") {
    return "This account is not a member of an active shop.";
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

    // Always Cracker Store. The shop id comes from this lookup, never the browser.
    const shopResult = await supabase
      .from("shops")
      .select("id, name, slug, active")
      .eq("slug", singleShopSlug)
      .eq("active", true)
      .maybeSingle();

    if (shopResult.error) {
      console.error("Current shop lookup failed:", shopResult.error.message);
      return { status: "unavailable" };
    }

    const shop = shopResult.data as ShopRow | null;

    if (!shop || !shop.active || shop.slug !== singleShopSlug) {
      return { status: "no-shop" };
    }

    const membership = await supabase
      .from("shop_members")
      .select("role")
      .eq("user_id", userId)
      .eq("shop_id", shop.id)
      .maybeSingle();

    if (membership.error) {
      console.error("Shop membership lookup failed:", membership.error.message);
      return { status: "unavailable" };
    }

    const role = shopRole(membership.data?.role);

    if (role) {
      return {
        status: "ok",
        shop: {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          active: true,
          role,
        },
        supabase,
      };
    }

    const admin = await supabase.rpc("is_admin");

    if (admin.error) {
      console.error("Admin role check failed:", admin.error.message);
      return { status: "unavailable" };
    }

    if (admin.data !== true) {
      return { status: "forbidden" };
    }

    return {
      status: "ok",
      shop: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        active: true,
        role: "admin",
      },
      supabase,
    };
  } catch {
    console.error("Current shop lookup failed");
    return { status: "unavailable" };
  }
});

async function readPublicShop(
  supabase: SupabaseClient,
  slug: string,
): Promise<PublicShop | null> {
  let { data, error } = await supabase
    .from("shops")
    .select(publicShopMapColumns)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error && (error.code === "42703" || error.message.includes("maps_url"))) {
    const fallback = await supabase
      .from("shops")
      .select(publicShopColumns)
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error) {
    console.error("Public shop lookup failed:", error.message);
    throw new ShopUnavailableError();
  }

  if (!data) {
    return null;
  }

  const row = data as PublicShopRow;

  if (row.slug !== slug) {
    return null;
  }

  const phoneResult = await loadShopPhones(supabase, row.id);
  const phones = phoneResult.ok
    ? phoneResult.phones
    : phoneResult.missingTable
      ? legacyShopPhones(row)
      : null;

  if (!phones) {
    throw new ShopUnavailableError();
  }

  return toPublicShop(row, phones);
}

export const getPublicShop = cache(async (): Promise<PublicShop | null> => {
  await connection();

  const supabase = getSupabase();

  if (!supabase) {
    throw new ShopUnavailableError();
  }

  return readPublicShop(supabase, singleShopSlug);
});
