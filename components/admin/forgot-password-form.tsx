"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createBrowserAuthClient } from "@/lib/supabase/browser";

const sentMessage =
  "If an account exists for that email, we sent a password reset link.";

export function ForgotPasswordForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const supabase = createBrowserAuthClient();

    if (!supabase) {
      setError("Password reset is not configured yet.");
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=/auth/set-password`;
    setPending(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setPending(false);

    if (resetError) {
      const message = resetError.message.toLowerCase();
      const code = resetError.code ?? "";

      if (code === "over_request_rate_limit" || message.includes("rate limit")) {
        setError("Please wait a moment and try again.");
        return;
      }

      if (
        message.includes("not found") ||
        message.includes("does not exist") ||
        message.includes("user not")
      ) {
        setNotice(sentMessage);
        return;
      }

      setError("We could not send a reset email. Please try again.");
      return;
    }

    setNotice(sentMessage);
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={onSubmit}>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          disabled={pending}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 w-full rounded-full border border-line bg-background px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
      </label>
      {notice ? (
        <p role="status" className="text-sm leading-6 text-ink">
          {notice}
        </p>
      ) : null}
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
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-sm">
        <Link
          href="/admin/login"
          className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Back to login
        </Link>
      </p>
    </form>
  );
}
