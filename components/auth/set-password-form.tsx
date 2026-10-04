"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserAuthClient } from "@/lib/supabase/browser";

const fieldClassName =
  "h-11 w-full rounded-full border border-line bg-background px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60";

export function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use a password of at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }

    const supabase = createBrowserAuthClient();

    if (!supabase) {
      setError("Sign-in is not configured yet.");
      return;
    }

    setPending(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError("We could not save that password. Please try again.");
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={onSubmit}>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Password</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={password}
          disabled={pending}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClassName}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Confirm password</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          disabled={pending}
          onChange={(event) => setConfirm(event.target.value)}
          className={fieldClassName}
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
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
