"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapPriceList,
  missingPriceListTable,
  priceListBucket,
  priceListDisplayName,
  priceListFileMessage,
  type OfficialPriceList,
} from "@/lib/price-list";
import { currentShopMessage, getCurrentShop } from "@/lib/shop";

type ActionResult = { ok: true } | { ok: false; message: string };

type PriceListRow = {
  id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  uploaded_at: string;
};

const columns = "id, file_name, file_path, file_url, uploaded_at";

function failure(message: string): { ok: false; message: string } {
  return { ok: false, message };
}

function refresh() {
  revalidatePath("/admin/price-list");
  revalidatePath("/products");
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

export async function getAdminPriceList(): Promise<
  | { ok: true; priceList: OfficialPriceList | null }
  | { ok: false; message: string }
> {
  const current = await adminClient();

  if (!current.ok) {
    return current;
  }

  const { data, error } = await current.supabase
    .from("shop_price_lists")
    .select(columns)
    .eq("shop_id", current.shopId)
    .maybeSingle();

  if (error) {
    return failure(
      missingPriceListTable(error)
        ? "Run supabase/shop_price_list.sql in the Supabase SQL Editor, then reload this page."
        : "We could not load the price list. Please try again.",
    );
  }

  return {
    ok: true,
    priceList: data ? mapPriceList(data as PriceListRow) : null,
  };
}

async function removeStoredPdf(supabase: SupabaseClient, shopId: string, path: string) {
  if (!path.startsWith(`lists/${shopId}/`)) {
    return;
  }

  const { error } = await supabase.storage.from(priceListBucket).remove([path]);

  if (error) {
    console.error("Price list file cleanup failed:", error.message);
  }
}

export async function saveOfficialPriceList(formData: FormData): Promise<ActionResult> {
  const current = await adminClient();

  if (!current.ok) {
    return current;
  }

  const file = formData.get("pdf");

  if (!(file instanceof File) || file.size === 0) {
    return failure("Choose a PDF to upload.");
  }

  const message = priceListFileMessage(file);

  if (message) {
    return failure(message);
  }

  const existing = await current.supabase
    .from("shop_price_lists")
    .select("id, file_path")
    .eq("shop_id", current.shopId)
    .maybeSingle();

  if (existing.error) {
    return failure(
      missingPriceListTable(existing.error)
        ? "Run supabase/shop_price_list.sql in the Supabase SQL Editor, then reload this page."
        : "We could not save the price list. Please try again.",
    );
  }

  const path = `lists/${current.shopId}/${crypto.randomUUID()}.pdf`;
  const uploaded = await current.supabase.storage.from(priceListBucket).upload(path, file, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (uploaded.error) {
    console.error("Price list upload failed:", uploaded.error.message);
    return failure(
      uploaded.error.message.toLowerCase().includes("bucket")
        ? "Run supabase/shop_price_list.sql in the Supabase SQL Editor, then reload this page."
        : "We could not upload that PDF. Please try again.",
    );
  }

  const { data: publicUrl } = current.supabase.storage.from(priceListBucket).getPublicUrl(path);
  const record = {
    shop_id: current.shopId,
    file_name: priceListDisplayName(file.name),
    file_path: path,
    file_url: publicUrl.publicUrl,
    uploaded_at: new Date().toISOString(),
  };

  const saved = existing.data
    ? await current.supabase
        .from("shop_price_lists")
        .update(record)
        .eq("id", existing.data.id)
        .eq("shop_id", current.shopId)
    : await current.supabase.from("shop_price_lists").insert(record);

  if (saved.error) {
    await removeStoredPdf(current.supabase, current.shopId, path);
    console.error("Price list record failed:", saved.error.message);
    return failure("We could not save the price list. Please try again.");
  }

  if (existing.data?.file_path && existing.data.file_path !== path) {
    await removeStoredPdf(current.supabase, current.shopId, existing.data.file_path);
  }

  refresh();
  return { ok: true };
}

export async function deleteOfficialPriceList(): Promise<ActionResult> {
  const current = await adminClient();

  if (!current.ok) {
    return current;
  }

  const existing = await current.supabase
    .from("shop_price_lists")
    .select("id, file_path")
    .eq("shop_id", current.shopId)
    .maybeSingle();

  if (existing.error) {
    return failure(
      missingPriceListTable(existing.error)
        ? "Run supabase/shop_price_list.sql in the Supabase SQL Editor, then reload this page."
        : "We could not remove the price list. Please try again.",
    );
  }

  if (!existing.data) {
    return failure("There is no price list to remove.");
  }

  const removed = await current.supabase
    .from("shop_price_lists")
    .delete()
    .eq("id", existing.data.id)
    .eq("shop_id", current.shopId);

  if (removed.error) {
    console.error("Price list delete failed:", removed.error.message);
    return failure("We could not remove the price list. Please try again.");
  }

  await removeStoredPdf(current.supabase, current.shopId, existing.data.file_path);
  refresh();
  return { ok: true };
}
