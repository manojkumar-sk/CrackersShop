import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createAuthClient } from "@/lib/supabase/server";

const otpTypes = new Set<EmailOtpType>([
  "invite",
  "email",
  "signup",
  "magiclink",
  "recovery",
]);

function isPasswordReset(url: URL) {
  return (
    url.searchParams.get("type") === "recovery" ||
    url.searchParams.get("next") === "/auth/set-password"
  );
}

function passwordDestination(origin: string, reset: boolean) {
  return reset ? `${origin}/auth/set-password?flow=reset` : `${origin}/auth/set-password`;
}

function failureRedirect(url: URL) {
  if (isPasswordReset(url)) {
    return NextResponse.redirect(`${url.origin}/admin/forgot-password?error=expired`);
  }

  return NextResponse.redirect(`${url.origin}/admin/login?error=invite`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const supabase = await createAuthClient();

  if (!supabase) {
    return failureRedirect(url);
  }

  const reset = isPasswordReset(url);

  if ((url.searchParams.get("error") || url.searchParams.get("error_code")) && !code && !tokenHash) {
    return failureRedirect(url);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(passwordDestination(url.origin, reset));
    }

    console.error("Auth code exchange failed");
    return failureRedirect(url);
  }

  if (tokenHash && type && otpTypes.has(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (!error) {
      return NextResponse.redirect(
        passwordDestination(url.origin, reset || type === "recovery"),
      );
    }

    console.error("Auth verification failed");
    return failureRedirect(url);
  }

  return new NextResponse(
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Continue</title><body><p>Finishing sign-in…</p><script>
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      const reset = hash.get("type") === "recovery";
      const failure = reset ? "/admin/forgot-password?error=expired" : "/admin/login?error=invite";
      const success = reset ? "/auth/set-password?flow=reset" : "/auth/set-password";
      if (!access_token || !refresh_token) {
        window.location.replace(failure);
      } else {
        fetch("/auth/callback", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ access_token, refresh_token }),
        }).then((response) => {
          window.location.replace(response.ok ? success : failure);
        }).catch(() => {
          window.location.replace(failure);
        });
      }
    </script></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const accessToken =
    body && typeof body === "object" && "access_token" in body
      ? body.access_token
      : null;
  const refreshToken =
    body && typeof body === "object" && "refresh_token" in body
      ? body.refresh_token
      : null;

  if (
    typeof accessToken !== "string" ||
    typeof refreshToken !== "string" ||
    accessToken.length < 20 ||
    accessToken.length > 4096 ||
    refreshToken.length < 20 ||
    refreshToken.length > 4096
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createAuthClient();

  if (!supabase) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error("Auth session failed");
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    next: passwordDestination(url.origin, isPasswordReset(url)),
  });
}
