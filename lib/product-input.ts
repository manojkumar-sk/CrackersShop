import { discountPercent } from "@/lib/money";

export const maxImageBytes = 5 * 1024 * 1024;

export const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ProductInput = {
  name: string;
  categoryId: string;
  description: string;
  mrp: number;
  price: number;
  stock: number;
  active: boolean;
};

export function isUuid(value: string) {
  return uuidPattern.test(value);
}

export function slugFromName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function imageExtension(type: string) {
  if (type === "image/jpeg") {
    return "jpg";
  }

  if (type === "image/png") {
    return "png";
  }

  if (type === "image/webp") {
    return "webp";
  }

  return null;
}

export function imageFileMessage(file: File) {
  if (!acceptedImageTypes.includes(file.type as (typeof acceptedImageTypes)[number])) {
    return "Use a JPG, PNG, or WEBP image.";
  }

  if (file.size > maxImageBytes) {
    return "Use an image smaller than 5 MB.";
  }

  return null;
}

function wholeNumber(value: string) {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const number = Number(trimmed);

  return Number.isSafeInteger(number) ? number : null;
}

export function parseProductFields(fields: {
  name: string;
  categoryId: string;
  description: string;
  mrp: string;
  price: string;
  stock: string;
  active: boolean;
}): { ok: true; value: ProductInput } | { ok: false; message: string } {
  const name = fields.name.trim();

  if (!name) {
    return { ok: false, message: "Enter a product name." };
  }

  if (name.length > 120) {
    return { ok: false, message: "Use a product name under 120 characters." };
  }

  if (!slugFromName(name)) {
    return {
      ok: false,
      message: "Use a product name that contains letters or numbers.",
    };
  }

  if (!isUuid(fields.categoryId)) {
    return { ok: false, message: "Choose a category." };
  }

  const description = fields.description.trim();

  if (description.length > 2000) {
    return { ok: false, message: "Use a description under 2,000 characters." };
  }

  const mrp = wholeNumber(fields.mrp);

  if (mrp === null || mrp <= 0) {
    return { ok: false, message: "Enter an MRP greater than 0." };
  }

  const price = wholeNumber(fields.price);

  if (price === null || price <= 0) {
    return { ok: false, message: "Enter a selling price greater than 0." };
  }

  if (price > mrp) {
    return {
      ok: false,
      message: "Selling price cannot be greater than the MRP.",
    };
  }

  const stock = wholeNumber(fields.stock);

  if (stock === null || stock < 0) {
    return { ok: false, message: "Stock cannot be negative." };
  }

  if (discountPercent(mrp, price) > 100) {
    return { ok: false, message: "The discount could not be calculated." };
  }

  return {
    ok: true,
    value: {
      name,
      categoryId: fields.categoryId,
      description,
      mrp,
      price,
      stock,
      active: fields.active,
    },
  };
}
