import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createAuthClient } from "@/lib/supabase/server";

const otpTypes = new Set<EmailOtpType>(["invite", "email", "signup", "magiclink"]);

function loginRedirect(origin: string) {
  return NextResponse.redirect(`${origin}/admin/login?error=invite`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const supabase = await createAuthClient();

  if (!supabase) {
    return loginRedirect(url.origin);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${url.origin}/auth/set-password`);
    }

    console.error("Invite code exchange failed");
    return loginRedirect(url.origin);
  }

  if (tokenHash && type && otpTypes.has(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (!error) {
      return NextResponse.redirect(`${url.origin}/auth/set-password`);
    }

    console.error("Invite verification failed");
    return loginRedirect(url.origin);
  }

  return new NextResponse(
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Accept invite</title><body><p>Finishing the invite…</p><script>
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      if (!access_token || !refresh_token) {
        window.location.replace("/admin/login?error=invite");
      } else {
        fetch("/auth/callback", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ access_token, refresh_token }),
        }).then((response) => {
          window.location.replace(response.ok ? "/auth/set-password" : "/admin/login?error=invite");
        }).catch(() => {
          window.location.replace("/admin/login?error=invite");
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
    console.error("Invite session failed");
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  return NextResponse.json({ ok: true, next: `${url.origin}/auth/set-password` });
}
