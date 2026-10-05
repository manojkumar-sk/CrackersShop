"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSession } from "@/lib/admin";
import { isUuid } from "@/lib/product-input";
import { canManageShopAdmins, getCurrentShop, singleShopSlug } from "@/lib/shop";
import { logAuthFailure } from "@/lib/shop-invite";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type ActionFailure = { ok: false; message: string };

export type ShopAdminRecord = {
  userId: string;
  email: string;
  role: "owner" | "admin";
  createdAt: string;
  status: "Active" | null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const lastOwnerMessage = "The last Owner cannot be removed. Add another Owner first.";
const permissionMessage = "Only an Owner can add or remove admins.";

function failure(message: string): ActionFailure {
  return { ok: false, message };
}

function accountAlreadyExists(error: { message: string; code?: string }) {
  const message = error.message.toLowerCase();
  return (
    error.code === "email_exists" ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("already exists")
  );
}

async function requireStaffManager() {
  const [session, current] = await Promise.all([getAdminSession(), getCurrentShop()]);

  if (session.status === "unavailable" || current.status === "unavailable") {
    return failure("We could not verify admin access. Please try again.");
  }

  if (session.status !== "admin" || current.status !== "ok" || current.shop.slug !== singleShopSlug) {
    return failure(permissionMessage);
  }

  if (!canManageShopAdmins({ platform: session.platform, role: current.shop.role })) {
    return failure(permissionMessage);
  }

  const service = createServiceRoleClient();

  if (!service) {
    console.error("Admin accounts are not configured: service role client is unavailable");
    return failure("Admin accounts are not configured on the server yet.");
  }

  return {
    ok: true as const,
    service,
    shopId: current.shop.id,
  };
}

async function findAuthUserId(service: SupabaseClient, email: string) {
  const perPage = 200;

  for (let page = 1; page <= 20; page += 1) {
    const listed = await service.auth.admin.listUsers({ page, perPage });

    if (listed.error) {
      logAuthFailure("Admin user lookup failed", listed.error);
      return { error: true as const, id: null };
    }

    const match = listed.data.users.find((user) => user.email?.toLowerCase() === email);

    if (match) {
      return { error: false as const, id: match.id };
    }

    if (listed.data.users.length < perPage) {
      return { error: false as const, id: null };
    }
  }

  return { error: false as const, id: null };
}

async function memberStatus(service: SupabaseClient, userId: string) {
  const { data, error } = await service.auth.admin.getUserById(userId);

  if (error || !data.user) {
    return { email: "Unknown account", status: null as ShopAdminRecord["status"] };
  }

  return {
    email: data.user.email ?? "Unknown account",
    status: "Active" as const,
  };
}

async function membership(
  service: SupabaseClient,
  shopId: string,
  userId: string,
) {
  const existing = await service
    .from("shop_members")
    .select("user_id, role")
    .eq("shop_id", shopId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) {
    console.error("Admin membership lookup failed:", existing.error.message);
    return { error: true as const, role: null };
  }

  const role = existing.data?.role;

  if (role !== "owner" && role !== "admin") {
    return { error: false as const, role: null };
  }

  return { error: false as const, role };
}

async function ownerCount(service: SupabaseClient, shopId: string) {
  const { count, error } = await service
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

async function insertMember(
  service: SupabaseClient,
  shopId: string,
  userId: string,
  role: "owner" | "admin",
) {
  const existing = await membership(service, shopId, userId);

  if (existing.error) {
    return failure("We could not add that admin. Please try again.");
  }

  if (existing.role) {
    return failure("This user is already an admin.");
  }

  const { error } = await service.from("shop_members").insert({
    shop_id: shopId,
    user_id: userId,
    role,
  });

  if (error) {
    console.error("Admin membership insert failed:", error.message);

    if (error.code === "23505") {
      return failure("This user is already an admin.");
    }

    return failure("We could not add that admin. Please try again.");
  }

  revalidatePath("/admin/admins");
  return { ok: true as const };
}

async function addExistingAuthUser(
  service: SupabaseClient,
  shopId: string,
  userId: string,
  role: "owner" | "admin",
) {
  const current = await membership(service, shopId, userId);

  if (current.error) {
    return failure("We could not add that admin. Please try again.");
  }

  if (current.role) {
    return failure("This user is already an admin.");
  }

  return insertMember(service, shopId, userId, role);
}

async function removeCreatedAuthUser(service: SupabaseClient, userId: string) {
  const removed = await service.auth.admin.deleteUser(userId);

  if (removed.error) {
    logAuthFailure("Admin membership rollback failed", removed.error);
  }
}

export async function listCrackerStoreAdmins(): Promise<
  { ok: true; shopName: string; members: ShopAdminRecord[] } | ActionFailure
> {
  const manager = await requireStaffManager();

  if (!manager.ok) {
    return manager;
  }

  const shop = await manager.service
    .from("shops")
    .select("name")
    .eq("id", manager.shopId)
    .eq("slug", singleShopSlug)
    .maybeSingle();

  if (shop.error || !shop.data) {
    console.error("Admin shop lookup failed:", shop.error?.message ?? "missing");
    return failure("We could not load admins. Please try again.");
  }

  const { data, error } = await manager.service
    .from("shop_members")
    .select("user_id, role, created_at")
    .eq("shop_id", manager.shopId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Admin list failed:", error.message);
    return failure("We could not load admins. Please try again.");
  }

  const members: ShopAdminRecord[] = [];

  for (const row of data ?? []) {
    if (row.role !== "owner" && row.role !== "admin") {
      continue;
    }

    if (!isUuid(row.user_id)) {
      continue;
    }

    const account = await memberStatus(manager.service, row.user_id);
    members.push({
      userId: row.user_id,
      email: account.email,
      role: row.role,
      createdAt: row.created_at,
      status: account.status,
    });
  }

  return { ok: true, shopName: shop.data.name, members };
}

export async function addCrackerStoreAdmin(
  formData: FormData,
): Promise<ActionFailure | { ok: true }> {
  formData.delete("shop_id");
  formData.delete("user_id");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!emailPattern.test(email) || email.length > 200) {
    return failure("Enter a valid email address.");
  }

  if (password.length < 8) {
    return failure("Use a password of at least 8 characters.");
  }

  if (password.length > 72) {
    return failure("Use a password of 72 characters or fewer.");
  }

  if (role !== "owner" && role !== "admin") {
    return failure("Choose Admin or Owner.");
  }

  const manager = await requireStaffManager();

  if (!manager.ok) {
    return manager;
  }

  const existingUser = await findAuthUserId(manager.service, email);

  if (existingUser.error) {
    return failure("We could not look up that account. Please try again.");
  }

  if (existingUser.id) {
    return addExistingAuthUser(manager.service, manager.shopId, existingUser.id, role);
  }

  const created = await manager.service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (created.error || !created.data.user?.id) {
    if (created.error && accountAlreadyExists(created.error)) {
      const retry = await findAuthUserId(manager.service, email);

      if (retry.error || !retry.id) {
        return failure("A user with this email already exists.");
      }

      return addExistingAuthUser(manager.service, manager.shopId, retry.id, role);
    }

    logAuthFailure("Admin createUser failed", created.error);
    return failure("We could not create that admin. Please try again.");
  }

  const added = await insertMember(
    manager.service,
    manager.shopId,
    created.data.user.id,
    role,
  );

  if (!added.ok) {
    if (added.message === "This user is already an admin.") {
      return added;
    }

    await removeCreatedAuthUser(manager.service, created.data.user.id);
    return failure("We could not add that admin. Please try again.");
  }

  return { ok: true };
}

export async function removeCrackerStoreAdmin(
  userId: string,
): Promise<ActionFailure | { ok: true }> {
  if (!isUuid(userId)) {
    return failure("We could not find that admin.");
  }

  const manager = await requireStaffManager();

  if (!manager.ok) {
    return manager;
  }

  const existing = await membership(manager.service, manager.shopId, userId);

  if (existing.error) {
    return failure("We could not remove that admin. Please try again.");
  }

  if (!existing.role) {
    return failure("We could not find that admin.");
  }

  if (existing.role === "owner") {
    const owners = await ownerCount(manager.service, manager.shopId);

    if (owners === null) {
      return failure("We could not remove that admin. Please try again.");
    }

    if (owners < 2) {
      return failure(lastOwnerMessage);
    }
  }

  const { error } = await manager.service
    .from("shop_members")
    .delete()
    .eq("shop_id", manager.shopId)
    .eq("user_id", userId);

  if (error) {
    console.error("Admin membership delete failed:", error.message);

    if (error.message.toLowerCase().includes("another owner")) {
      return failure(lastOwnerMessage);
    }

    return failure("We could not remove that admin. Please try again.");
  }

  revalidatePath("/admin/admins");
  return { ok: true };
}

export async function resetCrackerStoreAdminPassword(
  userId: string,
  password: string,
  confirmPassword: string,
): Promise<ActionFailure | { ok: true }> {
  if (!isUuid(userId)) {
    return failure("We could not find that admin.");
  }

  if (password.length < 8) {
    return failure("Use a password of at least 8 characters.");
  }

  if (password.length > 72) {
    return failure("Use a password of 72 characters or fewer.");
  }

  if (password !== confirmPassword) {
    return failure("The passwords do not match.");
  }

  const manager = await requireStaffManager();

  if (!manager.ok) {
    return manager;
  }

  const existing = await membership(manager.service, manager.shopId, userId);

  if (existing.error) {
    return failure("We could not reset that password. Please try again.");
  }

  if (!existing.role) {
    return failure("We could not find that admin.");
  }

  const updated = await manager.service.auth.admin.updateUserById(userId, { password });

  if (updated.error || !updated.data.user) {
    logAuthFailure("Admin password reset failed", updated.error);
    return failure("We could not reset that password. Please try again.");
  }

  return { ok: true };
}
