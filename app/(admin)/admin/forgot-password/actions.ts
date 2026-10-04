"use server";

import { createClient } from "@supabase/supabase-js";
import { configuredSiteOrigin } from "@/lib/site-url";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requestPasswordReset(
  email: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const trimmed = email.trim();

  if (!emailPattern.test(trimmed) || trimmed.length > 200) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const origin = await configuredSiteOrigin();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!origin || !url || !anonKey) {
    return { ok: false, message: "Password reset is not configured yet." };
  }

  const redirectTo = `${origin}/auth/callback?next=/auth/set-password`;
  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo });

  if (error) {
    const message = error.message.toLowerCase();
    const code = error.code ?? "";

    if (code === "over_request_rate_limit" || message.includes("rate limit")) {
      return { ok: false, message: "Please wait a moment and try again." };
    }

    if (
      message.includes("not found") ||
      message.includes("does not exist") ||
      message.includes("user not")
    ) {
      return { ok: true };
    }

    console.error("Password reset email failed:", error.message);
    return { ok: false, message: "We could not send a reset email. Please try again." };
  }

  return { ok: true };
}
