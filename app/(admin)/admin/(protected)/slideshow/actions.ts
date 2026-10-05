"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { imageExtension, imageFileMessage, isUuid } from "@/lib/product-input";
import { currentShopMessage, getCurrentShop } from "@/lib/shop";
import type { ShopSlide } from "@/lib/slides";

type ActionResult = { ok: true } | { ok: false; message: string };

type SlideRow = {
  id: string;
  image_url: string;
  image_path: string;
  heading: string;
  description: string;
  primary_label: string;
  primary_href: string;
  secondary_label: string | null;
  secondary_href: string | null;
  is_active: boolean;
  display_order: number;
};

const slideImages = "slide-images";
const slideColumns =
  "id, image_url, image_path, heading, description, primary_label, primary_href, secondary_label, secondary_href, is_active, display_order";

function failure(message: string): { ok: false; message: string } {
  return { ok: false, message };
}

function mapSlide(row: SlideRow): ShopSlide {
  return {
    id: row.id,
    imageUrl: row.image_url,
    imagePath: row.image_path,
    heading: row.heading,
    description: row.description,
    primaryLabel: row.primary_label,
    primaryHref: row.primary_href,
    secondaryLabel: row.secondary_label,
    secondaryHref: row.secondary_href,
    active: row.is_active,
    displayOrder: row.display_order,
  };
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

function linkField(value: string) {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
    return value;
  }

  try {
    const url = new URL(value);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function slideFields(formData: FormData) {
  const heading = textField(formData.get("heading"), 80);
  const description = textField(formData.get("description"), 280);
  const primaryLabel = textField(formData.get("primaryLabel"), 40);
  const primaryHref = linkField(textField(formData.get("primaryHref"), 200));
  const secondaryLabel = textField(formData.get("secondaryLabel"), 40);
  const secondaryRaw = textField(formData.get("secondaryHref"), 200);
  const orderRaw = textField(formData.get("displayOrder"), 6);
  const displayOrder = Number(orderRaw);

  if (!heading) {
    return failure("Enter a heading.");
  }

  if (!primaryLabel) {
    return failure("Enter the primary button text.");
  }

  if (!primaryHref) {
    return failure("Use a site path or a full http(s) link for the primary button.");
  }

  const hasSecondary = Boolean(secondaryLabel || secondaryRaw);

  if (hasSecondary && !secondaryLabel) {
    return failure("Enter the secondary button text, or leave both secondary fields empty.");
  }

  const secondaryHref = secondaryRaw ? linkField(secondaryRaw) : null;

  if (hasSecondary && !secondaryHref) {
    return failure("Use a site path or a full http(s) link for the secondary button.");
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 9999) {
    return failure("Enter a display order from 0 to 9999.");
  }

  return {
    ok: true as const,
    value: {
      heading,
      description,
      primary_label: primaryLabel,
      primary_href: primaryHref,
      secondary_label: hasSecondary ? secondaryLabel : null,
      secondary_href: hasSecondary ? secondaryHref : null,
      is_active: formData.get("active") === "on",
      display_order: displayOrder,
    },
  };
}

function imageFile(formData: FormData) {
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  return file;
}

async function uploadSlideImage(
  supabase: SupabaseClient,
  shopId: string,
  file: File,
) {
  const message = imageFileMessage(file);

  if (message) {
    return failure(message);
  }

  const extension = imageExtension(file.type);

  if (!extension) {
    return failure("Use a JPG, PNG, or WEBP image.");
  }

  const path = `slides/${shopId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(slideImages).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("Slide image upload failed:", error.message);
    return failure("We could not upload the banner. Please try again.");
  }

  const { data } = supabase.storage.from(slideImages).getPublicUrl(path);

  return { ok: true as const, url: data.publicUrl, path };
}

async function removeSlideImage(
  supabase: SupabaseClient,
  shopId: string,
  path: string,
  exceptId?: string,
) {
  if (!path.startsWith(`slides/${shopId}/`)) {
    return;
  }

  let query = supabase
    .from("shop_slides")
    .select("id")
    .eq("shop_id", shopId)
    .eq("image_path", path)
    .limit(1);

  if (exceptId) {
    query = query.neq("id", exceptId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Slide image reference check failed:", error.message);
    return;
  }

  if ((data?.length ?? 0) > 0) {
    return;
  }

  const { error: removeError } = await supabase.storage.from(slideImages).remove([path]);

  if (removeError) {
    console.error("Slide image delete failed:", removeError.message);
  }
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/slideshow");
}

export async function listSlides(): Promise<
  | { ok: true; slides: ShopSlide[] }
  | { ok: false; message: string; missing: boolean }
> {
  const current = await adminClient();

  if (!current.ok) {
    return { ok: false, message: current.message, missing: false };
  }

  const { data, error } = await current.supabase
    .from("shop_slides")
    .select(slideColumns)
    .eq("shop_id", current.shopId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Slide list failed:", error.message);
    const missing = error.code === "42P01" || error.message.includes("shop_slides");

    return {
      ok: false,
      missing,
      message: missing
        ? "The slideshow table is not in the database yet. Run supabase/shop_slides.sql in the Supabase SQL Editor, then reload this page."
        : "We could not load the slides. Please try again.",
    };
  }

  return { ok: true, slides: ((data ?? []) as SlideRow[]).map(mapSlide) };
}

export async function saveSlide(formData: FormData): Promise<ActionResult> {
  const current = await adminClient();

  if (!current.ok) {
    return current;
  }

  const parsed = slideFields(formData);

  if (!parsed.ok) {
    return parsed;
  }

  const slideId = textField(formData.get("slideId"), 40);
  const file = imageFile(formData);
  let uploaded: { url: string; path: string } | null = null;

  if (file) {
    const image = await uploadSlideImage(current.supabase, current.shopId, file);

    if (!image.ok) {
      return image;
    }

    uploaded = { url: image.url, path: image.path };
  }

  if (slideId) {
    if (!isUuid(slideId)) {
      return failure("That slide could not be found.");
    }

    const existing = await current.supabase
      .from("shop_slides")
      .select("id, image_path")
      .eq("id", slideId)
      .eq("shop_id", current.shopId)
      .maybeSingle();

    if (existing.error || !existing.data) {
      if (uploaded) {
        await current.supabase.storage.from(slideImages).remove([uploaded.path]);
      }

      return failure("That slide could not be found.");
    }

    if (!uploaded && !existing.data.image_path) {
      return failure("Add a banner image.");
    }

    const { error } = await current.supabase
      .from("shop_slides")
      .update({
        ...parsed.value,
        ...(uploaded
          ? { image_url: uploaded.url, image_path: uploaded.path }
          : {}),
      })
      .eq("id", slideId)
      .eq("shop_id", current.shopId);

    if (error) {
      console.error("Slide update failed:", error.message);

      if (uploaded) {
        await current.supabase.storage.from(slideImages).remove([uploaded.path]);
      }

      return failure("We could not save the slide. Please try again.");
    }

    if (uploaded && existing.data.image_path !== uploaded.path) {
      await removeSlideImage(
        current.supabase,
        current.shopId,
        existing.data.image_path,
        slideId,
      );
    }

    refresh();
    return { ok: true };
  }

  if (!uploaded) {
    return failure("Add a banner image.");
  }

  const { error } = await current.supabase.from("shop_slides").insert({
    shop_id: current.shopId,
    image_url: uploaded.url,
    image_path: uploaded.path,
    ...parsed.value,
  });

  if (error) {
    console.error("Slide insert failed:", error.message);
    await current.supabase.storage.from(slideImages).remove([uploaded.path]);
    const missing = error.code === "42P01" || error.message.includes("shop_slides");

    return failure(
      missing
        ? "The slideshow table is not in the database yet. Run supabase/shop_slides.sql in the Supabase SQL Editor."
        : "We could not save the slide. Please try again.",
    );
  }

  refresh();
  return { ok: true };
}

export async function setSlideActive(
  slideId: string,
  active: boolean,
): Promise<ActionResult> {
  const current = await adminClient();

  if (!current.ok) {
    return current;
  }

  if (!isUuid(slideId)) {
    return failure("That slide could not be found.");
  }

  const { error } = await current.supabase
    .from("shop_slides")
    .update({ is_active: active })
    .eq("id", slideId)
    .eq("shop_id", current.shopId);

  if (error) {
    console.error("Slide status update failed:", error.message);
    return failure("We could not update that slide. Please try again.");
  }

  refresh();
  return { ok: true };
}

export async function moveSlide(
  slideId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const current = await adminClient();

  if (!current.ok) {
    return current;
  }

  if (!isUuid(slideId)) {
    return failure("That slide could not be found.");
  }

  const { data, error } = await current.supabase
    .from("shop_slides")
    .select("id, display_order")
    .eq("shop_id", current.shopId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    return failure("We could not reorder the slides. Please try again.");
  }

  const ordered = data as { id: string; display_order: number }[];
  const index = ordered.findIndex((slide) => slide.id === slideId);
  const neighbor = direction === "up" ? index - 1 : index + 1;

  if (index < 0 || neighbor < 0 || neighbor >= ordered.length) {
    return { ok: true };
  }

  let movingOrder = ordered[index].display_order;
  let neighborOrder = ordered[neighbor].display_order;

  if (movingOrder === neighborOrder) {
    if (direction === "up") {
      movingOrder = Math.max(0, neighborOrder - 1);

      if (movingOrder === neighborOrder) {
        neighborOrder = 1;
      }
    } else {
      movingOrder = neighborOrder + 1;
    }
  } else {
    const swap = movingOrder;
    movingOrder = neighborOrder;
    neighborOrder = swap;
  }

  const updates = await Promise.all([
    current.supabase
      .from("shop_slides")
      .update({ display_order: movingOrder })
      .eq("id", ordered[index].id)
      .eq("shop_id", current.shopId),
    current.supabase
      .from("shop_slides")
      .update({ display_order: neighborOrder })
      .eq("id", ordered[neighbor].id)
      .eq("shop_id", current.shopId),
  ]);

  if (updates.some((result) => result.error)) {
    return failure("We could not reorder the slides. Please try again.");
  }

  refresh();
  return { ok: true };
}

export async function deleteSlide(slideId: string): Promise<ActionResult> {
  const current = await adminClient();

  if (!current.ok) {
    return current;
  }

  if (!isUuid(slideId)) {
    return failure("That slide could not be found.");
  }

  const existing = await current.supabase
    .from("shop_slides")
    .select("image_path")
    .eq("id", slideId)
    .eq("shop_id", current.shopId)
    .maybeSingle();

  if (existing.error || !existing.data) {
    return failure("That slide could not be found.");
  }

  const { error } = await current.supabase
    .from("shop_slides")
    .delete()
    .eq("id", slideId)
    .eq("shop_id", current.shopId);

  if (error) {
    console.error("Slide delete failed:", error.message);
    return failure("We could not delete that slide. Please try again.");
  }

  await removeSlideImage(current.supabase, current.shopId, existing.data.image_path);
  refresh();
  return { ok: true };
}
