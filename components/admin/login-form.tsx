"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserAuthClient } from "@/lib/supabase/browser";

function signInMessage(error: { message: string; code?: string }) {
  const code = error.code ?? "";
  const message = error.message.toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login")) {
    return "The email or password is not correct.";
  }

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Confirm this email address before signing in.";
  }

  return "We could not sign you in. Please try again.";
}

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (initialError !== "This account does not have admin access.") {
      return;
    }

    const supabase = createBrowserAuthClient();

    if (!supabase) {
      return;
    }

    void supabase.auth.signOut();
  }, [initialError]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const supabase = createBrowserAuthClient();

    if (!supabase) {
      setError("Admin sign-in is not configured yet.");
      return;
    }

    setPending(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setPending(false);
      setError(signInMessage(signInError));
      return;
    }

    const role = await supabase.rpc("is_admin");

    if (role.error) {
      await supabase.auth.signOut();
      setPending(false);
      setError("Admin access could not be verified. Please try again in a moment.");
      return;
    }

    if (role.data !== true) {
      const membership = await supabase.from("shop_members").select("shop_id").limit(1);

      if (membership.error || (membership.data?.length ?? 0) === 0) {
        await supabase.auth.signOut();
        setPending(false);
        setError(
          membership.error
            ? "Admin access could not be verified. Please try again in a moment."
            : "This account does not have admin access.",
        );
        return;
      }
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={onSubmit}>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          disabled={pending}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 w-full rounded-full border border-line bg-background px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Password
        </span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          disabled={pending}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 w-full rounded-full border border-line bg-background px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm leading-6 text-accent-deep">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground transition hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}
