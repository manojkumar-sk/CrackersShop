import type { SupabaseClient } from "@supabase/supabase-js";

export type ShopPhone = {
  phoneNumber: string;
  isWhatsapp: boolean;
  isPrimary: boolean;
};

export type ShopPhoneInput = ShopPhone & {
  displayOrder: number;
};

const phonePattern = /^[0-9]{10,15}$/;
const maxShopPhones = 10;

export function normalizeShopPhone(value: string) {
  return value.replace(/\D/g, "");
}

export function primaryWhatsAppNumber(phones: readonly ShopPhone[]) {
  const primary = phones.find((phone) => phone.isPrimary && phone.isWhatsapp);

  if (!primary || !phonePattern.test(primary.phoneNumber)) {
    return null;
  }

  return primary.phoneNumber;
}

export function withPrimaryWhatsApp<T extends ShopPhone>(phones: T[], preferredIndex = 0) {
  const explicit = phones.findIndex((phone) => phone.isPrimary && phone.isWhatsapp);
  let primaryIndex = explicit;

  if (primaryIndex < 0) {
    primaryIndex = phones.findIndex(
      (phone, index) => phone.isWhatsapp && index >= preferredIndex,
    );
  }

  if (primaryIndex < 0) {
    primaryIndex = phones.findIndex((phone) => phone.isWhatsapp);
  }

  return phones.map((phone, index) => ({
    ...phone,
    isPrimary: index === primaryIndex && phone.isWhatsapp,
  }));
}

export function parseShopPhones(
  raw: ShopPhone[],
): { ok: true; value: ShopPhoneInput[] } | { ok: false; message: string } {
  if (raw.length > maxShopPhones) {
    return { ok: false, message: "Add up to 10 phone numbers." };
  }

  const phones: ShopPhoneInput[] = [];
  const seen = new Set<string>();

  for (const row of raw) {
    const digits = normalizeShopPhone(row.phoneNumber);

    if (digits.length === 0) {
      continue;
    }

    if (!phonePattern.test(digits)) {
      return {
        ok: false,
        message: "Each phone number must be 10 to 15 digits, with no spaces or symbols.",
      };
    }

    if (seen.has(digits)) {
      return { ok: false, message: "This shop already has that phone number." };
    }

    if (row.isPrimary && !row.isWhatsapp) {
      return { ok: false, message: "The primary number must be a WhatsApp number." };
    }

    seen.add(digits);
    phones.push({
      phoneNumber: digits,
      isWhatsapp: row.isWhatsapp,
      isPrimary: row.isPrimary && row.isWhatsapp,
      displayOrder: phones.length,
    });
  }

  const primaryCount = phones.filter((phone) => phone.isPrimary).length;

  if (primaryCount > 1) {
    return { ok: false, message: "Choose one primary WhatsApp number." };
  }

  return { ok: true, value: withPrimaryWhatsApp(phones) };
}

export function appendShopPhones(formData: FormData, phones: ShopPhone[]) {
  formData.delete("shop_id");
  formData.set("phoneCount", String(phones.length));

  phones.forEach((phone, index) => {
    formData.set(`phone.${index}.number`, phone.phoneNumber);
    formData.set(`phone.${index}.whatsapp`, phone.isWhatsapp ? "1" : "0");
    formData.set(`phone.${index}.primary`, phone.isPrimary ? "1" : "0");
  });
}

export function phonesFromForm(
  formData: FormData,
): { ok: true; value: ShopPhoneInput[] } | { ok: false; message: string } {
  formData.delete("shop_id");
  const count = Number(formData.get("phoneCount") ?? "0");

  if (!Number.isInteger(count) || count < 0 || count > maxShopPhones) {
    return { ok: false, message: "Check the phone numbers and try again." };
  }

  const raw: ShopPhone[] = [];

  for (let index = 0; index < count; index += 1) {
    raw.push({
      phoneNumber: String(formData.get(`phone.${index}.number`) ?? ""),
      isWhatsapp: formData.get(`phone.${index}.whatsapp`) === "1",
      isPrimary: formData.get(`phone.${index}.primary`) === "1",
    });
  }

  return parseShopPhones(raw);
}

type PhoneRow = {
  phone_number: string;
  is_whatsapp: boolean;
  is_primary: boolean;
  display_order: number;
};

function phoneList(value: PhoneRow[] | PhoneRow | null | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function toShopPhones(value: PhoneRow[] | PhoneRow | null | undefined): ShopPhoneInput[] {
  return phoneList(value)
    .slice()
    .sort((left, right) => left.display_order - right.display_order)
    .map((row, index) => ({
      phoneNumber: row.phone_number,
      isWhatsapp: row.is_whatsapp,
      isPrimary: row.is_primary && row.is_whatsapp,
      displayOrder: index,
    }));
}

export async function loadShopPhones(
  supabase: SupabaseClient,
  shopId: string,
): Promise<
  { ok: true; phones: ShopPhoneInput[] } | { ok: false; missingTable: boolean; message: string }
> {
  const { data, error } = await supabase
    .from("shop_phone_numbers")
    .select("phone_number, is_whatsapp, is_primary, display_order")
    .eq("shop_id", shopId)
    .order("display_order", { ascending: true });

  if (error) {
    const missingTable = error.code === "PGRST205" || error.code === "42P01";

    if (!missingTable) {
      console.error("Shop phone lookup failed:", error.message);
    }

    return {
      ok: false,
      missingTable,
      message: "We could not load the phone numbers. Please try again.",
    };
  }

  return { ok: true, phones: toShopPhones((data ?? []) as PhoneRow[]) };
}

function phoneWriteMessage(code: string | undefined) {
  if (code === "23505") {
    return "This shop already has that phone number.";
  }

  if (code === "23514") {
    return "The primary number must be a WhatsApp number.";
  }

  return "We could not save the phone numbers. Please try again.";
}

export async function replaceShopPhones(
  supabase: SupabaseClient,
  shopId: string,
  phones: ShopPhoneInput[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  const cleared = await supabase
    .from("shop_phone_numbers")
    .update({ is_primary: false })
    .eq("shop_id", shopId);

  if (cleared.error) {
    console.error("Shop phone primary reset failed:", cleared.error.message);
    return { ok: false, message: phoneWriteMessage(cleared.error.code) };
  }

  const removed =
    phones.length === 0
      ? await supabase.from("shop_phone_numbers").delete().eq("shop_id", shopId)
      : await supabase
          .from("shop_phone_numbers")
          .delete()
          .eq("shop_id", shopId)
          .not("phone_number", "in", `(${phones.map((phone) => phone.phoneNumber).join(",")})`);

  if (removed.error) {
    console.error("Shop phone cleanup failed:", removed.error.message);
    return { ok: false, message: phoneWriteMessage(removed.error.code) };
  }

  if (phones.length > 0) {
    const saved = await supabase.from("shop_phone_numbers").upsert(
      phones.map((phone) => ({
        shop_id: shopId,
        phone_number: phone.phoneNumber,
        is_whatsapp: phone.isWhatsapp,
        is_primary: phone.isPrimary,
        display_order: phone.displayOrder,
      })),
      { onConflict: "shop_id,phone_number" },
    );

    if (saved.error) {
      console.error("Shop phone save failed:", saved.error.message);
      return { ok: false, message: phoneWriteMessage(saved.error.code) };
    }
  }

  const primary = phones.find((phone) => phone.isPrimary)?.phoneNumber ?? null;
  const other = phones.find((phone) => phone.phoneNumber !== primary)?.phoneNumber ?? null;
  const legacy = await supabase
    .from("shops")
    .update({
      whatsapp_number: primary,
      phone_number: other,
    })
    .eq("id", shopId);

  if (legacy.error) {
    console.error("Shop phone summary update failed:", legacy.error.message);
    return { ok: false, message: "We could not save the phone numbers. Please try again." };
  }

  return { ok: true };
}
