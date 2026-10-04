"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSession } from "@/lib/admin";
import { parseShopFields, type ShopInput } from "@/lib/shop-input";
import {
  loadShopPhones,
  phonesFromForm,
  primaryWhatsAppNumber,
  replaceShopPhones,
  toShopPhones,
  type ShopPhone,
} from "@/lib/shop-phones";
import { configuredSiteOrigin } from "@/lib/site-url";
import { stageShopInvite, unstageShopInvite } from "@/lib/shop-invite";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createAuthClient } from "@/lib/supabase/server";
import {
  imageExtension,
  imageFileMessage,
  isUuid,
} from "@/lib/product-input";

type ActionFailure = { ok: false; message: string };

const shopLogos = "shop-logos";
const lastOwnerMessage =
  "Assign another owner before removing or changing this one.";

export type PlatformShop = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  whatsappNumber: string | null;
  createdAt: string;
  ownerCount: number;
  memberCount: number;
};

export type ShopDraft = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  phones: ShopPhone[];
  address: string;
  email: string;
  businessHours: string;
  active: boolean;
};

export type ShopMemberRecord = {
  userId: string;
  email: string;
  role: "owner" | "admin";
  createdAt: string;
  status: "Invited" | "Active" | null;
};

function failure(message: string): ActionFailure {
  return { ok: false, message };
}

async function platformClient() {
  const session = await getAdminSession();

  if (session.status !== "admin" || !session.platform) {
    return failure("You do not have permission to manage shops.");
  }

  const supabase = await createAuthClient();

  if (!supabase) {
    return failure("We could not verify shop access. Please try again.");
  }

  const role = await supabase.rpc("is_admin");

  if (role.error || role.data !== true) {
    return failure("You do not have permission to manage shops.");
  }

  return { ok: true as const, supabase };
}

function storagePathFromUrl(url: string | null) {
  if (!url) {
    return null;
  }

  const marker = `/${shopLogos}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  const path = decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
  return path.startsWith("shops/") ? path : null;
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
    console.error("Shop logo upload failed:", error.message);
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
    console.error("Shop logo cleanup failed:", error.message);
  }
}

function selectedLogo(formData: FormData) {
  const image = formData.get("logo");

  if (!(image instanceof File) || image.size === 0) {
    return null;
  }

  return image;
}

function fieldsFromForm(formData: FormData, active: boolean) {
  return parseShopFields({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    address: String(formData.get("address") ?? ""),
    email: String(formData.get("email") ?? ""),
    businessHours: String(formData.get("businessHours") ?? ""),
    active,
  });
}

function shopValues(input: ShopInput, logoUrl: string | null) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    logo_url: logoUrl,
    address: input.address,
    email: input.email,
    business_hours: input.businessHours,
    active: input.active,
  };
}

export async function listPlatformShops(): Promise<
  { ok: true; shops: PlatformShop[] } | ActionFailure
> {
  const admin = await platformClient();

  if (!admin.ok) {
    return admin;
  }

  const [shopResult, memberResult] = await Promise.all([
    admin.supabase
      .from("shops")
      .select(
        "id, name, slug, active, created_at, shop_phone_numbers(phone_number, is_whatsapp, is_primary, display_order)",
      )
      .order("name", { ascending: true }),
    admin.supabase.from("shop_members").select("shop_id, role"),
  ]);

  if (shopResult.error || memberResult.error) {
    console.error(
      "Shop list failed:",
      shopResult.error?.message ?? memberResult.error?.message,
    );
    return failure("We could not load shops. Please try again.");
  }

  const counts = new Map<string, { members: number; owners: number }>();

  for (const row of memberResult.data ?? []) {
    const current = counts.get(row.shop_id) ?? { members: 0, owners: 0 };
    current.members += 1;

    if (row.role === "owner") {
      current.owners += 1;
    }

    counts.set(row.shop_id, current);
  }

  const shops = (shopResult.data ?? []).map((row) => {
    const count = counts.get(row.id) ?? { members: 0, owners: 0 };

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      active: row.active,
      whatsappNumber: primaryWhatsAppNumber(toShopPhones(row.shop_phone_numbers ?? null)),
      createdAt: row.created_at,
      memberCount: count.members,
      ownerCount: count.owners,
    };
  });

  return { ok: true, shops };
}

export async function getPlatformShop(
  shopId: string,
): Promise<{ ok: true; shop: ShopDraft } | ActionFailure | { ok: false; missing: true; message: string }> {
  if (!isUuid(shopId)) {
    return { ok: false, missing: true, message: "We could not find that shop." };
  }

  const admin = await platformClient();

  if (!admin.ok) {
    return admin;
  }

  const { data, error } = await admin.supabase
    .from("shops")
    .select(
      "id, name, slug, description, logo_url, address, email, business_hours, active",
    )
    .eq("id", shopId)
    .maybeSingle();

  if (error) {
    console.error("Shop lookup failed:", error.message);
    return failure("We could not load that shop. Please try again.");
  }

  if (!data) {
    return { ok: false, missing: true, message: "We could not find that shop." };
  }

  const phones = await loadShopPhones(admin.supabase, shopId);

  if (!phones.ok) {
    return phones;
  }

  return {
    ok: true,
    shop: {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description ?? "",
      logoUrl: data.logo_url,
      phones: phones.phones,
      address: data.address ?? "",
      email: data.email ?? "",
      businessHours: data.business_hours ?? "",
      active: data.active,
    },
  };
}

export async function createShop(formData: FormData): Promise<ActionFailure> {
  formData.delete("shop_id");
  const parsed = fieldsFromForm(formData, true);
  const phones = phonesFromForm(formData);

  if (!parsed.ok) {
    return parsed;
  }

  if (!phones.ok) {
    return phones;
  }

  const admin = await platformClient();

  if (!admin.ok) {
    return admin;
  }

  const shopId = crypto.randomUUID();
  const logo = selectedLogo(formData);
  let uploadedPath: string | null = null;
  let logoUrl: string | null = null;

  if (logo) {
    const uploaded = await uploadLogo(admin.supabase, shopId, logo);

    if (!uploaded.ok) {
      return uploaded;
    }

    uploadedPath = uploaded.path;
    logoUrl = uploaded.url;
  }

  const { error } = await admin.supabase
    .from("shops")
    .insert({ id: shopId, ...shopValues(parsed.value, logoUrl) });

  if (error) {
    await removeStoredLogo(admin.supabase, uploadedPath);
    console.error("Shop create failed:", error.message);

    if (error.code === "23505") {
      return failure("That slug is already used by another shop.");
    }

    return failure("We could not create this shop. Please try again.");
  }

  const savedPhones = await replaceShopPhones(admin.supabase, shopId, phones.value);

  if (!savedPhones.ok) {
    return failure(
      "The shop was created, but the phone numbers could not be saved. Open the shop and save them again.",
    );
  }

  revalidatePath("/admin/shops");
  redirect("/admin/shops?notice=created");
}

export async function updateShop(shopId: string, formData: FormData): Promise<ActionFailure> {
  formData.delete("shop_id");

  if (!isUuid(shopId)) {
    return failure("We could not find that shop.");
  }

  const parsed = fieldsFromForm(formData, formData.get("active") === "on");
  const phones = phonesFromForm(formData);

  if (!parsed.ok) {
    return parsed;
  }

  if (!phones.ok) {
    return phones;
  }

  const admin = await platformClient();

  if (!admin.ok) {
    return admin;
  }

  const existing = await admin.supabase
    .from("shops")
    .select("id, logo_url")
    .eq("id", shopId)
    .maybeSingle();

  if (existing.error) {
    console.error("Shop update lookup failed:", existing.error.message);
    return failure("We could not save this shop. Please try again.");
  }

  if (!existing.data) {
    return failure("We could not find that shop.");
  }

  const logo = selectedLogo(formData);
  let uploadedPath: string | null = null;
  let logoUrl = existing.data.logo_url;

  if (logo) {
    const uploaded = await uploadLogo(admin.supabase, shopId, logo);

    if (!uploaded.ok) {
      return uploaded;
    }

    uploadedPath = uploaded.path;
    logoUrl = uploaded.url;
  }

  const { data, error } = await admin.supabase
    .from("shops")
    .update(shopValues(parsed.value, logoUrl))
    .eq("id", shopId)
    .select("id");

  if (error || (data?.length ?? 0) === 0) {
    await removeStoredLogo(admin.supabase, uploadedPath);
    console.error("Shop update failed:", error?.message ?? "no row");

    if (error?.code === "23505") {
      return failure("That slug is already used by another shop.");
    }

    return failure(
      (data?.length ?? 0) === 0 && !error
        ? "We could not find that shop."
        : "We could not save this shop. Please try again.",
    );
  }

  const savedPhones = await replaceShopPhones(admin.supabase, shopId, phones.value);

  if (!savedPhones.ok) {
    return savedPhones;
  }

  if (uploadedPath) {
    await removeStoredLogo(admin.supabase, storagePathFromUrl(existing.data.logo_url));
  }

  revalidatePath("/admin/shops");
  revalidatePath(`/admin/shops/${shopId}/edit`);
  redirect("/admin/shops?notice=updated");
}

export async function setShopActive(
  shopId: string,
  active: boolean,
): Promise<ActionFailure | { ok: true }> {
  if (!isUuid(shopId)) {
    return failure("We could not find that shop.");
  }

  const admin = await platformClient();

  if (!admin.ok) {
    return admin;
  }

  const { data, error } = await admin.supabase
    .from("shops")
    .update({ active })
    .eq("id", shopId)
    .select("id");

  if (error) {
    console.error("Shop status update failed:", error.message);
    return failure("We could not update that shop. Please try again.");
  }

  if ((data?.length ?? 0) === 0) {
    return failure("We could not find that shop.");
  }

  revalidatePath("/admin/shops");
  return { ok: true };
}

export async function listShopMembers(
  shopId: string,
): Promise<{ ok: true; members: ShopMemberRecord[] } | ActionFailure> {
  if (!isUuid(shopId)) {
    return failure("We could not find that shop.");
  }

  const admin = await platformClient();

  if (!admin.ok) {
    return admin;
  }

  const { data, error } = await admin.supabase.rpc("shop_member_directory", {
    target_shop_id: shopId,
  });

  if (error) {
    console.error("Shop member list failed:", error.message);
    return failure("We could not load shop members. Please try again.");
  }

  const members: ShopMemberRecord[] = [];

  for (const row of (data ?? []) as {
    user_id: string;
    email: string | null;
    role: string;
    created_at: string;
  }[]) {
    if (row.role !== "owner" && row.role !== "admin") {
      continue;
    }

    members.push({
      userId: row.user_id,
      email: row.email ?? "Unknown account",
      role: row.role,
      createdAt: row.created_at,
      status: await memberInviteStatus(row.user_id),
    });
  }

  return { ok: true, members };
}

async function memberInviteStatus(userId: string): Promise<ShopMemberRecord["status"]> {
  const service = createServiceRoleClient();

  if (!service) {
    return null;
  }

  const { data, error } = await service.auth.admin.getUserById(userId);

  if (error || !data.user) {
    return null;
  }

  return data.user.last_sign_in_at ? "Active" : "Invited";
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function accountAlreadyExists(error: { message: string; code?: string }) {
  const message = error.message.toLowerCase();
  return (
    error.code === "email_exists" ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("already exists")
  );
}

async function inviteRedirectUrl() {
  const origin = await configuredSiteOrigin();
  return origin ? `${origin}/auth/callback` : null;
}

async function lookupAuthUser(supabase: SupabaseClient, email: string) {
  const lookup = await supabase.rpc("lookup_auth_user", { target_email: email });

  if (lookup.error) {
    console.error("Auth user lookup failed:", lookup.error.message);
    return { error: true as const, id: null };
  }

  const user = (lookup.data ?? [])[0] as { id: string } | undefined;
  return { error: false as const, id: user?.id ?? null };
}

async function insertShopMember(
  supabase: SupabaseClient,
  shopId: string,
  userId: string,
  role: "owner" | "admin",
) {
  const existing = await supabase
    .from("shop_members")
    .select("user_id")
    .eq("shop_id", shopId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) {
    console.error("Shop member lookup failed:", existing.error.message);
    return failure("We could not add that member. Please try again.");
  }

  if (existing.data) {
    return failure("User is already a member of this shop.");
  }

  const { error } = await supabase.from("shop_members").insert({
    shop_id: shopId,
    user_id: userId,
    role,
  });

  if (error) {
    console.error("Shop member insert failed:", error.message);

    if (error.code === "23505") {
      return failure("User is already a member of this shop.");
    }

    return failure("We could not add that member. Please try again.");
  }

  revalidatePath(`/admin/shops/${shopId}/members`);
  revalidatePath("/admin/shops");
  return { ok: true as const };
}

async function ownerCount(supabase: SupabaseClient, shopId: string) {
  const { count, error } = await supabase
    .from("shop_members")
    .select("user_id", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .eq("role", "owner");

  if (error) {
    console.error("Owner count failed:", error.message);
    return null;
  }

  return count ?? 0;
}

async function shopMemberExists(
  supabase: SupabaseClient,
  shopId: string,
  userId: string,
) {
  const existing = await supabase
    .from("shop_members")
    .select("user_id")
    .eq("shop_id", shopId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) {
    console.error("Shop member lookup failed:", existing.error.message);
    return { error: true as const, member: false };
  }

  return { error: false as const, member: Boolean(existing.data) };
}

async function sendReturningInvite(
  email: string,
  userId: string,
  shopId: string,
  role: "owner" | "admin",
): Promise<ActionFailure | { ok: true; outcome: "reinvited" }> {
  const staged = await stageShopInvite(userId, shopId, role);

  if (!staged) {
    return failure("We could not send the invite. Please try again.");
  }

  const service = createServiceRoleClient();
  const redirectTo = await inviteRedirectUrl();

  if (!service || !redirectTo) {
    await unstageShopInvite(userId, shopId);
    console.error("Shop invite is not configured: service role client is unavailable");
    return failure("Shop invites are not configured on the server yet.");
  }

  const invited = await service.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (!invited.error) {
    return { ok: true, outcome: "reinvited" };
  }

  if (!accountAlreadyExists(invited.error)) {
    await unstageShopInvite(userId, shopId);
    console.error("Shop invite failed:", invited.error.message);
    return failure("We could not send the invite. Please try again.");
  }

  const resent = await service.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectTo,
    },
  });

  if (resent.error) {
    await unstageShopInvite(userId, shopId);
    console.error("Shop reinvite failed:", resent.error.message);
    return failure("We could not send the invite. Please try again.");
  }

  return { ok: true, outcome: "reinvited" };
}

export async function addShopMember(
  shopId: string,
  formData: FormData,
): Promise<ActionFailure | { ok: true; outcome: "invited" | "reinvited" }> {
  formData.delete("shop_id");
  formData.delete("user_id");

  if (!isUuid(shopId)) {
    return failure("We could not find that shop.");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");

  if (!emailPattern.test(email) || email.length > 200) {
    return failure("Enter a valid email address.");
  }

  if (role !== "owner" && role !== "admin") {
    return failure("Choose owner or admin.");
  }

  const admin = await platformClient();

  if (!admin.ok) {
    return admin;
  }

  const shop = await admin.supabase.from("shops").select("id").eq("id", shopId).maybeSingle();

  if (shop.error || !shop.data) {
    return failure("We could not find that shop.");
  }

  const existingUser = await lookupAuthUser(admin.supabase, email);

  if (existingUser.error) {
    return failure("We could not look up that account. Please try again.");
  }

  if (existingUser.id) {
    const membership = await shopMemberExists(admin.supabase, shopId, existingUser.id);

    if (membership.error) {
      return failure("We could not add that member. Please try again.");
    }

    if (membership.member) {
      return failure("User is already a member of this shop.");
    }

    return sendReturningInvite(email, existingUser.id, shopId, role);
  }

  const service = createServiceRoleClient();

  if (!service) {
    console.error("Shop invite is not configured: service role client is unavailable");
    return failure("Shop invites are not configured on the server yet.");
  }

  const redirectTo = await inviteRedirectUrl();

  if (!redirectTo) {
    return failure("Shop invites are not configured on the server yet.");
  }

  const invited = await service.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (invited.error || !invited.data.user?.id) {
    if (invited.error && accountAlreadyExists(invited.error)) {
      const retry = await lookupAuthUser(admin.supabase, email);

      if (retry.error || !retry.id) {
        return failure("We could not send the invite. Please try again.");
      }

      const membership = await shopMemberExists(admin.supabase, shopId, retry.id);

      if (membership.error) {
        return failure("We could not add that member. Please try again.");
      }

      if (membership.member) {
        return failure("User is already a member of this shop.");
      }

      return sendReturningInvite(email, retry.id, shopId, role);
    }

    console.error("Shop invite failed:", invited.error?.message ?? "no user");
    return failure("We could not send the invite. Please try again.");
  }

  const added = await insertShopMember(
    admin.supabase,
    shopId,
    invited.data.user.id,
    role,
  );

  if (!added.ok) {
    if (added.message === "User is already a member of this shop.") {
      return added;
    }

    return failure(
      "The account was created, but we could not add them to this shop. Try again to finish adding them.",
    );
  }

  return { ok: true, outcome: "invited" };
}

export async function setShopMemberRole(
  shopId: string,
  userId: string,
  role: string,
): Promise<ActionFailure | { ok: true }> {
  if (!isUuid(shopId) || !isUuid(userId)) {
    return failure("We could not find that member.");
  }

  if (role !== "owner" && role !== "admin") {
    return failure("Choose owner or admin.");
  }

  const admin = await platformClient();

  if (!admin.ok) {
    return admin;
  }

  const existing = await admin.supabase
    .from("shop_members")
    .select("role")
    .eq("shop_id", shopId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error || !existing.data) {
    return failure("We could not find that member.");
  }

  if (existing.data.role === "owner" && role !== "owner") {
    const owners = await ownerCount(admin.supabase, shopId);

    if (owners === null) {
      return failure("We could not update that member. Please try again.");
    }

    if (owners < 2) {
      return failure(lastOwnerMessage);
    }
  }

  const { data, error } = await admin.supabase
    .from("shop_members")
    .update({ role })
    .eq("shop_id", shopId)
    .eq("user_id", userId)
    .select("user_id");

  if (error) {
    console.error("Shop member role update failed:", error.message);

    if (error.message.includes("another owner")) {
      return failure(lastOwnerMessage);
    }

    return failure("We could not update that member. Please try again.");
  }

  if ((data?.length ?? 0) === 0) {
    return failure("We could not find that member.");
  }

  revalidatePath(`/admin/shops/${shopId}/members`);
  revalidatePath("/admin/shops");
  return { ok: true };
}

export async function removeShopMember(
  shopId: string,
  userId: string,
): Promise<ActionFailure | { ok: true }> {
  if (!isUuid(shopId) || !isUuid(userId)) {
    return failure("We could not find that member.");
  }

  const admin = await platformClient();

  if (!admin.ok) {
    return admin;
  }

  const existing = await admin.supabase
    .from("shop_members")
    .select("role")
    .eq("shop_id", shopId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error || !existing.data) {
    return failure("We could not find that member.");
  }

  if (existing.data.role === "owner") {
    const owners = await ownerCount(admin.supabase, shopId);

    if (owners === null) {
      return failure("We could not remove that member. Please try again.");
    }

    if (owners < 2) {
      return failure(lastOwnerMessage);
    }
  }

  const { error } = await admin.supabase
    .from("shop_members")
    .delete()
    .eq("shop_id", shopId)
    .eq("user_id", userId);

  if (error) {
    console.error("Shop member delete failed:", error.message);

    if (error.message.includes("another owner")) {
      return failure(lastOwnerMessage);
    }

    return failure("We could not remove that member. Please try again.");
  }

  revalidatePath(`/admin/shops/${shopId}/members`);
  revalidatePath("/admin/shops");
  return { ok: true };
}
