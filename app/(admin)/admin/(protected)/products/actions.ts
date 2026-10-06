"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentShopMessage, getCurrentShop } from "@/lib/shop";
import { discountPercent } from "@/lib/money";
import {
  imageExtension,
  imageFileMessage,
  isUuid,
  parseProductFields,
  slugFromName,
  type ProductInput,
} from "@/lib/product-input";

type ActionFailure = { ok: false; message: string; duplicate?: boolean };

const productImages = "product-images";

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

  const marker = `/${productImages}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  const path = decodeURIComponent(url.slice(index + marker.length).split("?")[0]);

  return path.startsWith("products/") ? path : null;
}

async function slugTaken(
  supabase: SupabaseClient,
  shopId: string,
  slug: string,
  exceptId?: string,
) {
  let query = supabase
    .from("products")
    .select("id")
    .eq("shop_id", shopId)
    .eq("slug", slug)
    .limit(1);

  if (exceptId) {
    query = query.neq("id", exceptId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Product slug lookup failed:", error.message);
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
  productId: string,
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

  const path = `products/${productId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(productImages).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("Product image upload failed:", error.message);
    return failure("We could not upload the image. Please try again.");
  }

  const { data } = supabase.storage.from(productImages).getPublicUrl(path);

  return { ok: true as const, url: data.publicUrl, path };
}

async function removeStoredImage(
  supabase: SupabaseClient,
  path: string | null,
) {
  if (!path) {
    return;
  }

  const { error } = await supabase.storage.from(productImages).remove([path]);

  if (error) {
    console.error("Product image cleanup failed:", error.message);
  }
}

function fieldsFromForm(formData: FormData) {
  return parseProductFields({
    name: String(formData.get("name") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    description: String(formData.get("description") ?? ""),
    mrp: String(formData.get("mrp") ?? ""),
    price: String(formData.get("price") ?? ""),
    stock: String(formData.get("stock") ?? ""),
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

async function categoryExists(
  supabase: SupabaseClient,
  shopId: string,
  categoryId: string,
) {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (error) {
    console.error("Category check failed:", error.message);
    return failure("We could not check that category. Please try again.");
  }

  if (!data) {
    return failure("Choose a category.");
  }

  return { ok: true as const };
}

async function saveProduct(
  supabase: SupabaseClient,
  shopId: string,
  id: string,
  input: ProductInput,
  slug: string,
  imageUrl: string | null,
  mode: "insert" | "update",
) {
  const values = {
    category_id: input.categoryId,
    name: input.name,
    slug,
    description: input.description,
    mrp: input.mrp,
    selling_price: input.price,
    discount_percentage: discountPercent(input.mrp, input.price),
    stock_quantity: input.stock,
    is_active: input.active,
    image_url: imageUrl,
  };

  const result =
    mode === "insert"
      ? await supabase.from("products").insert({ id, shop_id: shopId, ...values })
      : await supabase
          .from("products")
          .update(values)
          .eq("id", id)
          .eq("shop_id", shopId)
          .select("id");

  if (!result.error && mode === "update" && (result.data?.length ?? 0) === 0) {
    return failure("We could not find that product.");
  }

  if (result.error) {
    console.error("Product save failed:", result.error.message);

    if (result.error.code === "23505") {
      return {
        ok: false as const,
        duplicate: true,
        message: "Choose a slightly different product name and try again.",
      };
    }

    return failure("We could not save this product. Please try again.");
  }

  return { ok: true as const };
}

export async function createProduct(formData: FormData): Promise<ActionFailure> {
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
  const category = await categoryExists(supabase, shopId, parsed.value.categoryId);

  if (!category.ok) {
    return category;
  }

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
    return failure("We could not create a unique address for this product.");
  }

  let saved = await saveProduct(
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
      saved = await saveProduct(
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

  redirect("/admin/products?notice=created");
}

export async function updateProduct(
  productId: string,
  formData: FormData,
): Promise<ActionFailure> {
  formData.delete("shop_id");

  if (!isUuid(productId)) {
    return failure("We could not find that product.");
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
    .from("products")
    .select("id, name, slug, image_url")
    .eq("id", productId)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (existing.error) {
    console.error("Product lookup failed:", existing.error.message);
    return failure("We could not save this product. Please try again.");
  }

  if (!existing.data) {
    return failure("We could not find that product.");
  }

  const category = await categoryExists(supabase, shopId, parsed.value.categoryId);

  if (!category.ok) {
    return category;
  }

  const nameChanged = existing.data.name.trim() !== parsed.value.name;
  let slug = nameChanged
    ? await chooseSlug(supabase, shopId, parsed.value.name, productId)
    : existing.data.slug;

  if (!slug) {
    return failure("We could not create a unique address for this product.");
  }

  const image = selectedImage(formData);
  let imageUrl = existing.data.image_url as string | null;
  let uploadedPath: string | null = null;

  if (image) {
    const uploaded = await uploadImage(supabase, productId, image);

    if (!uploaded.ok) {
      return uploaded;
    }

    imageUrl = uploaded.url;
    uploadedPath = uploaded.path;
  }

  let saved = await saveProduct(
    supabase,
    shopId,
    productId,
    parsed.value,
    slug,
    imageUrl,
    "update",
  );

  if (!saved.ok && nameChanged && saved.duplicate) {
    slug = await chooseSlug(supabase, shopId, parsed.value.name, productId);

    if (slug) {
      saved = await saveProduct(
        supabase,
        shopId,
        productId,
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

  redirect("/admin/products?notice=updated");
}

export async function deleteProduct(
  productId: string,
): Promise<ActionFailure | { ok: true }> {
  if (!isUuid(productId)) {
    return failure("We could not find that product.");
  }

  const admin = await adminClient();

  if (!admin.ok) {
    return admin;
  }

  const supabase = admin.supabase;
  const shopId = admin.shopId;
  const existing = await supabase
    .from("products")
    .select("id, image_url")
    .eq("id", productId)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (existing.error) {
    console.error("Product lookup failed:", existing.error.message);
    return failure("We could not delete this product. Please try again.");
  }

  if (!existing.data) {
    return failure("We could not find that product.");
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("shop_id", shopId);

  if (error) {
    console.error("Product delete failed:", error.message);
    return failure("We could not delete this product. Please try again.");
  }

  await removeStoredImage(
    supabase,
    storagePathFromUrl(existing.data.image_url),
  );
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  return { ok: true };
}
