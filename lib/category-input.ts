import { slugFromName } from "@/lib/product-input";

export type CategoryInput = {
  name: string;
  description: string;
  active: boolean;
};

export function parseCategoryFields(fields: {
  name: string;
  description: string;
  active: boolean;
}): { ok: true; value: CategoryInput } | { ok: false; message: string } {
  const name = fields.name.trim();

  if (!name) {
    return { ok: false, message: "Enter a category name." };
  }

  if (name.length > 120) {
    return { ok: false, message: "Use a category name under 120 characters." };
  }

  if (!slugFromName(name)) {
    return {
      ok: false,
      message: "Use a category name that contains letters or numbers.",
    };
  }

  const description = fields.description.trim();

  if (description.length > 2000) {
    return { ok: false, message: "Use a description under 2,000 characters." };
  }

  return {
    ok: true,
    value: {
      name,
      description,
      active: fields.active,
    },
  };
}
