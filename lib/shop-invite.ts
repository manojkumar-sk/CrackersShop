import "server-only";
import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { isUuid } from "@/lib/product-input";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const pendingKey = "pending_shop_invites";

const emailInMessage = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function logAuthFailure(
  step: string,
  error: { name?: string; message?: string; code?: string; status?: number } | null | undefined,
) {
  console.error(step, {
    name: error?.name ?? null,
    code: error?.code ?? null,
    status: error?.status ?? null,
    message: (error?.message ?? "").replace(emailInMessage, "[email]"),
  });
}

function logServiceRoleAvailability(step: string) {
  console.error(step, {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
  });
}

type PendingInvite = {
  shop_id: string;
  role: "owner" | "admin";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function pendingInvitesFromMetadata(metadata: unknown): PendingInvite[] {
  if (!isRecord(metadata) || !Array.isArray(metadata[pendingKey])) {
    return [];
  }

  const invites: PendingInvite[] = [];

  for (const item of metadata[pendingKey]) {
    if (!isRecord(item)) {
      continue;
    }

    const shopId = item.shop_id;
    const role = item.role;

    if (
      typeof shopId === "string" &&
      isUuid(shopId) &&
      (role === "owner" || role === "admin")
    ) {
      invites.push({ shop_id: shopId, role });
    }
  }

  return invites;
}

async function writePendingInvites(userId: string, invites: PendingInvite[]) {
  const service = createServiceRoleClient();

  if (!service) {
    logServiceRoleAvailability("Shop invite service role client is unavailable");
    return false;
  }

  const current = await service.auth.admin.getUserById(userId);

  if (current.error || !current.data.user) {
    logAuthFailure("Shop invite lookup failed", current.error);
    return false;
  }

  const metadata = isRecord(current.data.user.app_metadata)
    ? { ...current.data.user.app_metadata }
    : {};

  if (invites.length === 0) {
    delete metadata[pendingKey];
  } else {
    metadata[pendingKey] = invites;
  }

  const updated = await service.auth.admin.updateUserById(userId, {
    app_metadata: metadata,
  });

  if (updated.error) {
    logAuthFailure("Shop invite metadata update failed", updated.error);
    return false;
  }

  return true;
}

export async function stageShopInvite(
  userId: string,
  shopId: string,
  role: "owner" | "admin",
) {
  const service = createServiceRoleClient();

  if (!service) {
    logServiceRoleAvailability("Shop invite service role client is unavailable");
    return false;
  }

  const current = await service.auth.admin.getUserById(userId);

  if (current.error || !current.data.user) {
    logAuthFailure("Shop invite lookup failed", current.error);
    return false;
  }

  const pending = pendingInvitesFromMetadata(current.data.user.app_metadata).filter(
    (invite) => invite.shop_id !== shopId,
  );
  pending.push({ shop_id: shopId, role });
  return writePendingInvites(userId, pending);
}

export async function unstageShopInvite(userId: string, shopId: string) {
  const service = createServiceRoleClient();

  if (!service) {
    return;
  }

  const current = await service.auth.admin.getUserById(userId);

  if (current.error || !current.data.user) {
    return;
  }

  const pending = pendingInvitesFromMetadata(current.data.user.app_metadata).filter(
    (invite) => invite.shop_id !== shopId,
  );
  await writePendingInvites(userId, pending);
}

type SessionReader = {
  auth: {
    getUser: () => PromiseLike<{
      data: { user: User | null };
      error: { message: string } | null;
    }>;
  };
};

/**
 * Adds shop memberships that a platform admin staged for this Auth user.
 * Password-reset callbacks must not call this.
 */
export async function acceptPendingShopInvites(supabase: SessionReader) {
  const userResult = await supabase.auth.getUser();
  const user = userResult.data.user;

  if (userResult.error || !user) {
    return true;
  }

  const pending = pendingInvitesFromMetadata(user.app_metadata);

  if (pending.length === 0) {
    return true;
  }

  const service = createServiceRoleClient();

  if (!service) {
    console.error("Pending shop invite could not be accepted");
    return false;
  }

  for (const invite of pending) {
    const existing = await service
      .from("shop_members")
      .select("user_id")
      .eq("shop_id", invite.shop_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing.error) {
      console.error("Pending shop invite lookup failed:", existing.error.message);
      return false;
    }

    if (existing.data) {
      continue;
    }

    const inserted = await service.from("shop_members").insert({
      shop_id: invite.shop_id,
      user_id: user.id,
      role: invite.role,
    });

    if (inserted.error && inserted.error.code !== "23505") {
      console.error("Pending shop invite insert failed:", inserted.error.message);
      return false;
    }

    revalidatePath(`/admin/shops/${invite.shop_id}/members`);
    revalidatePath("/admin/shops");
    revalidatePath("/admin/admins");
  }

  const cleared = await writePendingInvites(user.id, []);

  if (!cleared) {
    console.error("Pending shop invite cleanup failed");
  }

  return true;
}
