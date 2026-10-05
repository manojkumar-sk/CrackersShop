"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSession } from "@/lib/admin";
import { getCurrentShop } from "@/lib/shop";
import { parseShopSettings } from "@/lib/shop-input";
import { loadShopPhones, phonesFromForm, replaceShopPhones, type ShopPhone } from "@/lib/shop-phones";
import { imageExtension, imageFileMessage, isUuid } from "@/lib/product-input";

type ActionFailure = { ok: false; message: string };

const shopLogos = "shop-logos";

export type ShopSettings = {
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  phones: ShopPhone[];
  address: string;
  email: string;
  businessHours: string;
  mapsUrl: string;
  latitude: string;
  longitude: string;
  canEdit: boolean;
};

function failure(message: string): ActionFailure {
  return { ok: false, message };
}

async function currentShopClient() {
  const [session, current] = await Promise.all([getAdminSession(), getCurrentShop()]);

  if (session.status !== "admin" || current.status !== "ok") {
    return failure("We could not open shop settings. Please try again.");
  }

  return {
    ok: true as const,
    supabase: current.supabase,
    shopId: current.shop.id,
    slug: current.shop.slug,
    canEdit: current.shop.role === "owner" || session.platform,
  };
}

function storagePathFromUrl(url: string | null, shopId: string) {
  if (!url) {
    return null;
  }

  const marker = `/${shopLogos}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  const path = decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
  const prefix = `shops/${shopId}/`;

  if (!path.startsWith(prefix) || path.includes("..")) {
    return null;
  }

  return path;
}

async function uploadLogo(supabase: SupabaseClient, shopId: string, file: File) {
  const message = imageFileMessage(file);

  if (message) {
    return failure(message);
  }

  const extension = imageExtension(file.type);

  if (!extension) {
    return failure("Use a JPG, PNG, or WEBP image.");
  }

  const path = `shops/${shopId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(shopLogos).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("Shop settings logo upload failed:", error.message);
    return failure("We could not upload the logo. Please try again.");
  }

  const { data } = supabase.storage.from(shopLogos).getPublicUrl(path);
  return { ok: true as const, url: data.publicUrl, path };
}

async function removeStoredLogo(supabase: SupabaseClient, path: string | null) {
  if (!path) {
    return;
  }

  const { error } = await supabase.storage.from(shopLogos).remove([path]);

  if (error) {
    console.error("Shop settings logo cleanup failed:", error.message);
  }
}

export async function getShopSettings(): Promise<
  { ok: true; settings: ShopSettings } | ActionFailure
> {
  const current = await currentShopClient();

  if (!current.ok) {
    return current;
  }

  const { data, error } = await current.supabase
    .from("shops")
    .select(
      "id, name, slug, description, logo_url, address, email, business_hours, maps_url, latitude, longitude",
    )
    .eq("id", current.shopId)
    .maybeSingle();

  if (error && (error.code === "42703" || error.message.includes("maps_url"))) {
    return failure("Run supabase/shop_map.sql in the Supabase SQL Editor, then reload settings.");
  }

  if (error) {
    console.error("Shop settings lookup failed:", error.message);
    return failure("We could not load shop settings. Please try again.");
  }

  if (!data || data.slug !== current.slug) {
    return failure("We could not load shop settings. Please try again.");
  }

  const phones = await loadShopPhones(current.supabase, current.shopId);

  if (!phones.ok) {
    return phones;
  }

  return {
    ok: true,
    settings: {
      name: data.name,
      slug: data.slug,
      description: data.description ?? "",
      logoUrl: data.logo_url,
      phones: phones.phones,
      address: data.address ?? "",
      email: data.email ?? "",
      businessHours: data.business_hours ?? "",
      mapsUrl: data.maps_url ?? "",
      latitude: data.latitude == null ? "" : String(data.latitude),
      longitude: data.longitude == null ? "" : String(data.longitude),
      canEdit: current.canEdit,
    },
  };
}

export async function updateShopSettings(formData: FormData): Promise<ActionFailure | { ok: true }> {
  formData.delete("shop_id");
  formData.delete("id");
  formData.delete("slug");
  formData.delete("active");

  const parsed = parseShopSettings({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    address: String(formData.get("address") ?? ""),
    email: String(formData.get("email") ?? ""),
    businessHours: String(formData.get("businessHours") ?? ""),
    mapsUrl: String(formData.get("mapsUrl") ?? ""),
    latitude: String(formData.get("latitude") ?? ""),
    longitude: String(formData.get("longitude") ?? ""),
  });
  const phones = phonesFromForm(formData);

  if (!parsed.ok) {
    return parsed;
  }

  if (!phones.ok) {
    return phones;
  }

  const current = await currentShopClient();

  if (!current.ok) {
    return current;
  }

  if (!current.canEdit) {
    return failure("Only the shop owner can change these settings.");
  }

  if (!isUuid(current.shopId)) {
    return failure("We could not save shop settings. Please try again.");
  }

  const existing = await current.supabase
    .from("shops")
    .select("id, slug, logo_url")
    .eq("id", current.shopId)
    .maybeSingle();

  if (existing.error || !existing.data || existing.data.slug !== current.slug) {
    return failure("We could not save shop settings. Please try again.");
  }

  const image = formData.get("logo");
  const logo = image instanceof File && image.size > 0 ? image : null;
  let uploadedPath: string | null = null;
  let logoUrl = existing.data.logo_url;

  if (logo) {
    const uploaded = await uploadLogo(current.supabase, current.shopId, logo);

    if (!uploaded.ok) {
      return uploaded;
    }

    uploadedPath = uploaded.path;
    logoUrl = uploaded.url;
  }

  const { data, error } = await current.supabase
    .from("shops")
    .update({
      name: parsed.value.name,
      description: parsed.value.description,
      logo_url: logoUrl,
      address: parsed.value.address,
      email: parsed.value.email,
      business_hours: parsed.value.businessHours,
      maps_url: parsed.value.mapsUrl,
      latitude: parsed.value.latitude,
      longitude: parsed.value.longitude,
    })
    .eq("id", current.shopId)
    .select("id, slug");

  if (error || (data?.length ?? 0) === 0 || data?.[0]?.slug !== existing.data.slug) {
    await removeStoredLogo(current.supabase, uploadedPath);
    console.error("Shop settings update failed:", error?.message ?? "slug or row mismatch");

    if (error?.code === "42703" || error?.message.includes("maps_url")) {
      return failure("Run supabase/shop_map.sql in the Supabase SQL Editor, then save again.");
    }

    return failure("We could not save shop settings. Please try again.");
  }

  const savedPhones = await replaceShopPhones(current.supabase, current.shopId, phones.value);

  if (!savedPhones.ok) {
    return savedPhones;
  }

  if (uploadedPath) {
    await removeStoredLogo(
      current.supabase,
      storagePathFromUrl(existing.data.logo_url, current.shopId),
    );
  }

  return { ok: true };
}
