import { isReservedShopSlug, shopSlugPattern } from "@/lib/shop-host";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ShopInput = {
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  email: string | null;
  businessHours: string | null;
  active: boolean;
};

function optionalText(value: string, limit: number, label: string) {
  const text = value.trim();

  if (text.length === 0) {
    return { ok: true as const, value: null };
  }

  if (text.length > limit) {
    return { ok: false as const, message: `Use a ${label} under ${limit} characters.` };
  }

  return { ok: true as const, value: text };
}

function optionalEmail(value: string) {
  const text = optionalText(value, 200, "email");

  if (!text.ok || !text.value) {
    return text;
  }

  if (!emailPattern.test(text.value)) {
    return { ok: false as const, message: "Enter a valid email address." };
  }

  return text;
}

export function parseShopFields(fields: {
  name: string;
  slug: string;
  description: string;
  address: string;
  email: string;
  businessHours: string;
  active: boolean;
}): { ok: true; value: ShopInput } | { ok: false; message: string } {
  const name = fields.name.trim();
  const slug = fields.slug.trim().toLowerCase();

  if (name.length === 0) {
    return { ok: false, message: "Enter the shop name." };
  }

  if (name.length > 120) {
    return { ok: false, message: "Use a shop name under 120 characters." };
  }

  if (!shopSlugPattern.test(slug)) {
    return {
      ok: false,
      message: "Use a lowercase slug with letters, numbers, and hyphens only.",
    };
  }

  if (isReservedShopSlug(slug)) {
    return { ok: false, message: "This address is reserved for the platform." };
  }

  const description = optionalText(fields.description, 2000, "description");

  if (!description.ok) {
    return description;
  }

  const address = optionalText(fields.address, 400, "address");

  if (!address.ok) {
    return address;
  }

  const email = optionalEmail(fields.email);

  if (!email.ok) {
    return email;
  }

  const businessHours = optionalText(fields.businessHours, 200, "business hours");

  if (!businessHours.ok) {
    return businessHours;
  }

  return {
    ok: true,
    value: {
      name,
      slug,
      description: description.value,
      address: address.value,
      email: email.value,
      businessHours: businessHours.value,
      active: fields.active,
    },
  };
}

export type ShopSettingsInput = {
  name: string;
  description: string | null;
  address: string | null;
  email: string | null;
  businessHours: string | null;
};

export function parseShopSettings(fields: {
  name: string;
  description: string;
  address: string;
  email: string;
  businessHours: string;
}): { ok: true; value: ShopSettingsInput } | { ok: false; message: string } {
  const parsed = parseShopFields({
    ...fields,
    slug: "settings",
    active: true,
  });

  if (!parsed.ok) {
    return parsed;
  }

  return {
    ok: true,
    value: {
      name: parsed.value.name,
      description: parsed.value.description,
      address: parsed.value.address,
      email: parsed.value.email,
      businessHours: parsed.value.businessHours,
    },
  };
}
