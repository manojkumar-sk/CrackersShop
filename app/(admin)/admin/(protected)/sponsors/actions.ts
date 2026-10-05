"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { imageExtension, imageFileMessage, isUuid } from "@/lib/product-input";
import { currentShopMessage, getCurrentShop } from "@/lib/shop";
import { mapSponsor, type ShopSponsor } from "@/lib/sponsors";

type ActionResult = { ok: true } | { ok: false; message: string };

type SponsorRow = {
  id: string;
  name: string;
  logo_url: string;
  logo_path: string;
  website_url: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
};

const sponsorImages = "sponsor-images";
const sponsorColumns =
  "id, name, logo_url, logo_path, website_url, description, is_active, display_order";

function failure(message: string): { ok: false; message: string } {
  return { ok: false, message };
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/sponsors");
}

async function adminClient() {
  const current = await getCurrentShop();

  if (current.status !== "ok") {
    return failure(currentShopMessage(current.status));
  }

  return {
    ok: true as const,
    supabase: current.supabase,
    shopId: current.shop.id,
  };
}

function textField(value: FormDataEntryValue | null, max: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, max);
}

function websiteField(value: string) {
  if (!value) {
    return { ok: true as const, value: null };
  }

  try {
    const url = new URL(value);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return { ok: true as const, value: url.toString() };
    }
  } catch {
    return failure("Use a full http(s) website link, or leave it empty.");
  }

  return failure("Use a full http(s) website link, or leave it empty.");
}

function sponsorFields(formData: FormData) {
  const name = textField(formData.get("name"), 80);
  const description = textField(formData.get("description"), 180);
  const website = websiteField(textField(formData.get("websiteUrl"), 300));
  const displayOrder = Number(textField(formData.get("displayOrder"), 6));

  if (!name) {
    return failure("Enter the sponsor name.");
  }

  if (!website.ok) {
    return website;
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 9999) {
    return failure("Enter a display order from 0 to 9999.");
  }

  return {
    ok: true as const,
    value: {
      name,
      description: description || null,
      website_url: website.value,
      is_active: formData.get("active") === "on",
      display_order: displayOrder,
    },
  };
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

  const path = `sponsors/${shopId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(sponsorImages).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("Sponsor image upload failed:", error.message);
    return failure("We could not upload the logo. Please try again.");
  }

  const { data } = supabase.storage.from(sponsorImages).getPublicUrl(path);
  return { ok: true as const, url: data.publicUrl, path };
}

async function removeLogo(supabase: SupabaseClient, shopId: string, path: string, exceptId?: string) {
  if (!path.startsWith(`sponsors/${shopId}/`)) {
    return;
  }

  let query = supabase
    .from("shop_sponsors")
    .select("id")
    .eq("shop_id", shopId)
    .eq("logo_path", path)
    .limit(1);

  if (exceptId) {
    query = query.neq("id", exceptId);
  }

  const existing = await query;

  if (existing.error || (existing.data?.length ?? 0) > 0) {
    return;
  }

  const { error } = await supabase.storage.from(sponsorImages).remove([path]);

  if (error) {
    console.error("Sponsor image cleanup failed:", error.message);
  }
}

export async function listSponsors(): Promise<
  { ok: true; sponsors: ShopSponsor[] } | { ok: false; message: string; missing: boolean }
> {
  const current = await adminClient();

  if (!current.ok) {
    return { ok: false, message: current.message, missing: false };
  }

  const { data, error } = await current.supabase
    .from("shop_sponsors")
    .select(sponsorColumns)
    .eq("shop_id", current.shopId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    const missing = error.code === "42P01" || error.message.includes("shop_sponsors");
    return {
      ok: false,
      missing,
      message: missing
        ? "Run supabase/shop_sponsors.sql in the Supabase SQL Editor, then reload this page."
        : "We could not load sponsors. Please try again.",
    };
  }

  return { ok: true, sponsors: ((data ?? []) as SponsorRow[]).map(mapSponsor) };
}

export async function saveSponsor(formData: FormData): Promise<ActionResult> {
  const current = await adminClient();

  if (!current.ok) {
    return current;
  }

  const fields = sponsorFields(formData);

  if (!fields.ok) {
    return fields;
  }

  const id = textField(formData.get("id"), 40);
  const file = formData.get("image");
  const image = file instanceof File && file.size > 0 ? file : null;

  if (id && !isUuid(id)) {
    return failure("That sponsor could not be found.");
  }

  if (!id && !image) {
    return failure("Choose a logo image.");
  }

  let uploaded: { url: string; path: string } | null = null;

  if (image) {
    const result = await uploadLogo(current.supabase, current.shopId, image);

    if (!result.ok) {
      return result;
    }

    uploaded = { url: result.url, path: result.path };
  }

  if (!id) {
    const { error } = await current.supabase.from("shop_sponsors").insert({
      shop_id: current.shopId,
      logo_url: uploaded?.url,
      logo_path: uploaded?.path,
      ...fields.value,
    });

    if (error) {
      if (uploaded) {
        await removeLogo(current.supabase, current.shopId, uploaded.path);
      }

      console.error("Sponsor insert failed:", error.message);
      return failure(
        error.code === "42P01"
          ? "Run supabase/shop_sponsors.sql in the Supabase SQL Editor, then try again."
          : "We could not save that sponsor. Please try again.",
      );
    }

    refresh();
    return { ok: true };
  }

  const existing = await current.supabase
    .from("shop_sponsors")
    .select("logo_path")
    .eq("id", id)
    .eq("shop_id", current.shopId)
    .maybeSingle();

  if (existing.error || !existing.data) {
    if (uploaded) {
      await removeLogo(current.supabase, current.shopId, uploaded.path);
    }

    return failure("That sponsor could not be found.");
  }

  const { error } = await current.supabase
    .from("shop_sponsors")
    .update({
      ...fields.value,
      ...(uploaded ? { logo_url: uploaded.url, logo_path: uploaded.path } : {}),
    })
    .eq("id", id)
    .eq("shop_id", current.shopId);

  if (error) {
    if (uploaded) {
      await removeLogo(current.supabase, current.shopId, uploaded.path);
    }

    return failure("We could not save that sponsor. Please try again.");
  }

  if (uploaded) {
    await removeLogo(current.supabase, current.shopId, existing.data.logo_path, id);
  }

  refresh();
  return { ok: true };
}

export async function moveSponsor(sponsorId: string, direction: "up" | "down"): Promise<ActionResult> {
  const current = await adminClient();

  if (!current.ok) {
    return current;
  }

  if (!isUuid(sponsorId)) {
    return failure("That sponsor could not be found.");
  }

  const { data, error } = await current.supabase
    .from("shop_sponsors")
    .select("id, display_order")
    .eq("shop_id", current.shopId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    return failure("We could not reorder sponsors. Please try again.");
  }

  const ordered = data as { id: string; display_order: number }[];
  const index = ordered.findIndex((row) => row.id === sponsorId);
  const neighbor = direction === "up" ? index - 1 : index + 1;

  if (index < 0 || neighbor < 0 || neighbor >= ordered.length) {
    return { ok: true };
  }

  let movingOrder = ordered[index].display_order;
  let neighborOrder = ordered[neighbor].display_order;

  if (movingOrder === neighborOrder) {
    movingOrder = direction === "up" ? Math.max(0, neighborOrder - 1) : neighborOrder + 1;

    if (movingOrder === neighborOrder) {
      neighborOrder = 1;
    }
  } else {
    const swap = movingOrder;
    movingOrder = neighborOrder;
    neighborOrder = swap;
  }

  const updates = await Promise.all([
    current.supabase
      .from("shop_sponsors")
      .update({ display_order: movingOrder })
      .eq("id", ordered[index].id)
      .eq("shop_id", current.shopId),
    current.supabase
      .from("shop_sponsors")
      .update({ display_order: neighborOrder })
      .eq("id", ordered[neighbor].id)
      .eq("shop_id", current.shopId),
  ]);

  if (updates.some((result) => result.error)) {
    return failure("We could not reorder sponsors. Please try again.");
  }

  refresh();
  return { ok: true };
}

export async function deleteSponsor(sponsorId: string): Promise<ActionResult> {
  const current = await adminClient();

  if (!current.ok) {
    return current;
  }

  if (!isUuid(sponsorId)) {
    return failure("That sponsor could not be found.");
  }

  const existing = await current.supabase
    .from("shop_sponsors")
    .select("logo_path")
    .eq("id", sponsorId)
    .eq("shop_id", current.shopId)
    .maybeSingle();

  if (existing.error || !existing.data) {
    return failure("That sponsor could not be found.");
  }

  const { error } = await current.supabase
    .from("shop_sponsors")
    .delete()
    .eq("id", sponsorId)
    .eq("shop_id", current.shopId);

  if (error) {
    return failure("We could not delete that sponsor. Please try again.");
  }

  await removeLogo(current.supabase, current.shopId, existing.data.logo_path);
  refresh();
  return { ok: true };
}
