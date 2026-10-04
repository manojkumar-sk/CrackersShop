"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentShopMessage, getCurrentShop } from "@/lib/shop";
import { parseCategoryFields, type CategoryInput } from "@/lib/category-input";
import {
  imageExtension,
  imageFileMessage,
  isUuid,
  slugFromName,
} from "@/lib/product-input";

type ActionFailure = { ok: false; message: string; duplicate?: boolean };

const categoryImages = "category-images";
const productsRemain =
  "This category contains products. Move or delete those products before deleting the category.";

function failure(message: string): ActionFailure {
  return { ok: false, message };
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

function storagePathFromUrl(url: string | null) {
  if (!url) {
    return null;
  }

  const marker = `/${categoryImages}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  const path = decodeURIComponent(url.slice(index + marker.length).split("?")[0]);

  return path.startsWith("categories/") ? path : null;
}

async function slugTaken(
  supabase: SupabaseClient,
  shopId: string,
  slug: string,
  exceptId?: string,
) {
  let query = supabase
    .from("categories")
    .select("id")
    .eq("shop_id", shopId)
    .eq("slug", slug)
    .limit(1);

  if (exceptId) {
    query = query.neq("id", exceptId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Category slug lookup failed:", error.message);
    return null;
  }

  return (data?.length ?? 0) > 0;
}

async function chooseSlug(
  supabase: SupabaseClient,
  shopId: string,
  name: string,
  exceptId?: string,
) {
  const base = slugFromName(name);
  const baseTaken = await slugTaken(supabase, shopId, base, exceptId);

  if (baseTaken === null) {
    return null;
  }

  if (!baseTaken) {
    return base;
  }

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    const taken = await slugTaken(supabase, shopId, candidate, exceptId);

    if (taken === null) {
      return null;
    }

    if (!taken) {
      return candidate;
    }
  }

  return null;
}

async function uploadImage(
  supabase: SupabaseClient,
  categoryId: string,
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

  const path = `categories/${categoryId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(categoryImages).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("Category image upload failed:", error.message);
    return failure("We could not upload the image. Please try again.");
  }

  const { data } = supabase.storage.from(categoryImages).getPublicUrl(path);

  return { ok: true as const, url: data.publicUrl, path };
}

async function removeStoredImage(
  supabase: SupabaseClient,
  path: string | null,
) {
  if (!path) {
    return;
  }

  const { error } = await supabase.storage.from(categoryImages).remove([path]);

  if (error) {
    console.error("Category image cleanup failed:", error.message);
  }
}

function fieldsFromForm(formData: FormData) {
  return parseCategoryFields({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    active: formData.get("active") === "on",
  });
}

function selectedImage(formData: FormData) {
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return null;
  }

  return image;
}

async function saveCategory(
  supabase: SupabaseClient,
  shopId: string,
  id: string,
  input: CategoryInput,
  slug: string,
  imageUrl: string | null,
  mode: "insert" | "update",
) {
  const values = {
    name: input.name,
    slug,
    description: input.description,
    is_active: input.active,
    image_url: imageUrl,
  };

  const result =
    mode === "insert"
      ? await supabase.from("categories").insert({ id, shop_id: shopId, ...values })
      : await supabase
          .from("categories")
          .update(values)
          .eq("id", id)
          .eq("shop_id", shopId)
          .select("id");

  if (!result.error && mode === "update" && (result.data?.length ?? 0) === 0) {
    return failure("We could not find that category.");
  }

  if (result.error) {
    console.error("Category save failed:", result.error.message);

    if (result.error.code === "23505") {
      return {
        ok: false as const,
        duplicate: true,
        message: "Choose a slightly different category name and try again.",
      };
    }

    return failure("We could not save this category. Please try again.");
  }

  return { ok: true as const };
}

export async function createCategory(formData: FormData): Promise<ActionFailure> {
  formData.delete("shop_id");
  const parsed = fieldsFromForm(formData);

  if (!parsed.ok) {
    return parsed;
  }

  const admin = await adminClient();

  if (!admin.ok) {
    return admin;
  }

  const supabase = admin.supabase;
  const shopId = admin.shopId;
  const id = crypto.randomUUID();
  const image = selectedImage(formData);
  let uploadedUrl: string | null = null;
  let uploadedPath: string | null = null;

  if (image) {
    const uploaded = await uploadImage(supabase, id, image);

    if (!uploaded.ok) {
      return uploaded;
    }

    uploadedUrl = uploaded.url;
    uploadedPath = uploaded.path;
  }

  let slug = await chooseSlug(supabase, shopId, parsed.value.name);

  if (!slug) {
    await removeStoredImage(supabase, uploadedPath);
    return failure("We could not create a unique address for this category.");
  }

  let saved = await saveCategory(
    supabase,
    shopId,
    id,
    parsed.value,
    slug,
    uploadedUrl,
    "insert",
  );

  if (!saved.ok && saved.duplicate) {
    slug = await chooseSlug(supabase, shopId, parsed.value.name);

    if (slug) {
      saved = await saveCategory(
        supabase,
        shopId,
        id,
        parsed.value,
        slug,
        uploadedUrl,
        "insert",
      );
    }
  }

  if (!saved.ok) {
    await removeStoredImage(supabase, uploadedPath);
    return saved;
  }

  redirect("/admin/categories?notice=created");
}

export async function updateCategory(
  categoryId: string,
  formData: FormData,
): Promise<ActionFailure> {
  formData.delete("shop_id");

  if (!isUuid(categoryId)) {
    return failure("We could not find that category.");
  }

  const parsed = fieldsFromForm(formData);

  if (!parsed.ok) {
    return parsed;
  }

  const admin = await adminClient();

  if (!admin.ok) {
    return admin;
  }

  const supabase = admin.supabase;
  const shopId = admin.shopId;
  const existing = await supabase
    .from("categories")
    .select("id, name, slug, image_url")
    .eq("id", categoryId)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (existing.error) {
    console.error("Category lookup failed:", existing.error.message);
    return failure("We could not save this category. Please try again.");
  }

  if (!existing.data) {
    return failure("We could not find that category.");
  }

  const nameChanged = existing.data.name.trim() !== parsed.value.name;
  let slug = nameChanged
    ? await chooseSlug(supabase, shopId, parsed.value.name, categoryId)
    : existing.data.slug;

  if (!slug) {
    return failure("We could not create a unique address for this category.");
  }

  const image = selectedImage(formData);
  let imageUrl = existing.data.image_url as string | null;
  let uploadedPath: string | null = null;

  if (image) {
    const uploaded = await uploadImage(supabase, categoryId, image);

    if (!uploaded.ok) {
      return uploaded;
    }

    imageUrl = uploaded.url;
    uploadedPath = uploaded.path;
  }

  let saved = await saveCategory(
    supabase,
    shopId,
    categoryId,
    parsed.value,
    slug,
    imageUrl,
    "update",
  );

  if (!saved.ok && nameChanged && saved.duplicate) {
    slug = await chooseSlug(supabase, shopId, parsed.value.name, categoryId);

    if (slug) {
      saved = await saveCategory(
        supabase,
        shopId,
        categoryId,
        parsed.value,
        slug,
        imageUrl,
        "update",
      );
    }
  }

  if (!saved.ok) {
    await removeStoredImage(supabase, uploadedPath);
    return saved;
  }

  if (uploadedPath) {
    await removeStoredImage(
      supabase,
      storagePathFromUrl(existing.data.image_url),
    );
  }

  redirect("/admin/categories?notice=updated");
}

export async function deleteCategory(
  categoryId: string,
): Promise<ActionFailure | { ok: true }> {
  if (!isUuid(categoryId)) {
    return failure("We could not find that category.");
  }

  const admin = await adminClient();

  if (!admin.ok) {
    return admin;
  }

  const supabase = admin.supabase;
  const shopId = admin.shopId;
  const existing = await supabase
    .from("categories")
    .select("id, image_url")
    .eq("id", categoryId)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (existing.error) {
    console.error("Category lookup failed:", existing.error.message);
    return failure("We could not delete this category. Please try again.");
  }

  if (!existing.data) {
    return failure("We could not find that category.");
  }

  const products = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("shop_id", shopId);

  if (products.error) {
    console.error("Category product count failed:", products.error.message);
    return failure("We could not delete this category. Please try again.");
  }

  if ((products.count ?? 0) > 0) {
    return failure(productsRemain);
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("shop_id", shopId);

  if (error) {
    console.error("Category delete failed:", error.message);

    if (error.code === "23503") {
      return failure(productsRemain);
    }

    return failure("We could not delete this category. Please try again.");
  }

  await removeStoredImage(
    supabase,
    storagePathFromUrl(existing.data.image_url),
  );
  revalidatePath("/admin/categories");
  return { ok: true };
}
