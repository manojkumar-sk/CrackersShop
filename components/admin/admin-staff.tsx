"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  addCrackerStoreAdmin,
  removeCrackerStoreAdmin,
  resetCrackerStoreAdminPassword,
  type ShopAdminRecord,
} from "@/app/(admin)/admin/(protected)/admins/actions";
import { useDisclosure } from "@/hooks/use-disclosure";

const fieldClassName =
  "h-11 w-full rounded-full border border-line bg-background px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60";

function formatCreated(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function AdminStaff({
  shopName,
  members,
}: {
  shopName: string;
  members: ShopAdminRecord[];
}) {
  const router = useRouter();
  const form = useDisclosure();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "owner">("admin");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [target, setTarget] = useState<ShopAdminRecord | null>(null);
  const [removeError, setRemoveError] = useState("");
  const [resetTarget, setResetTarget] = useState<ShopAdminRecord | null>(null);
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const ownerCount = members.filter((member) => member.role === "owner").length;

  useEffect(() => {
    if (!target && !resetTarget) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || pending) {
        return;
      }

      setTarget(null);
      setResetTarget(null);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pending, resetTarget, target]);

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (password.length < 8) {
      setError("Use a password of at least 8 characters.");
      return;
    }

    setPending(true);
    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    formData.set("role", role);
    const result = await addCrackerStoreAdmin(formData);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setNotice("Admin created successfully.");
    setEmail("");
    setPassword("");
    setRole("admin");
    form.close();
    router.refresh();
  }

  async function confirmRemove() {
    if (!target || pending) {
      return;
    }

    setRemoveError("");
    setPending(true);
    const result = await removeCrackerStoreAdmin(target.userId);
    setPending(false);

    if (!result.ok) {
      setRemoveError(result.message);
      return;
    }

    setNotice("Admin removed from this shop.");
    setTarget(null);
    router.refresh();
  }

  function openReset(member: ShopAdminRecord) {
    setResetError("");
    setNextPassword("");
    setConfirmPassword("");
    setTarget(null);
    setResetTarget(member);
  }

  async function confirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resetTarget || pending) {
      return;
    }

    setResetError("");

    if (nextPassword.length < 8) {
      setResetError("Use a password of at least 8 characters.");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setResetError("The passwords do not match.");
      return;
    }

    setPending(true);
    const result = await resetCrackerStoreAdminPassword(
      resetTarget.userId,
      nextPassword,
      confirmPassword,
    );
    setPending(false);

    if (!result.ok) {
      setResetError(result.message);
      return;
    }

    setNextPassword("");
    setConfirmPassword("");
    setResetTarget(null);
    setNotice("Password reset successfully.");
  }

  return (
    <div>
      <div className="mt-8">
        {form.isOpen ? (
          <form className="grid max-w-xl gap-3" onSubmit={onAdd}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium tracking-[0.14em] text-muted uppercase">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                disabled={pending}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium tracking-[0.14em] text-muted uppercase">
                Password
              </span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                disabled={pending}
                onChange={(event) => setPassword(event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block sm:max-w-40">
              <span className="mb-1.5 block text-xs font-medium tracking-[0.14em] text-muted uppercase">
                Role
              </span>
              <select
                value={role}
                disabled={pending}
                onChange={(event) => setRole(event.target.value === "owner" ? "owner" : "admin")}
                className={fieldClassName}
              >
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 w-fit items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create Admin"}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={form.open}
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Add Admin
          </button>
        )}
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        New staff are usually Admins. A new email can sign in immediately with the password set
        here. An email that already has an account is added to {shopName} without changing that
        password. Choosing Owner is only for someone who should manage this list.
      </p>
      {notice ? (
        <p role="status" className="mt-4 text-sm text-ink">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm text-accent-deep">
          {error}
        </p>
      ) : null}
      {members.length === 0 ? (
        <p className="mt-8 text-sm leading-6 text-muted">No admins are listed yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Admins</caption>
            <thead className="border-b border-line text-xs tracking-[0.14em] text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Email
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Role
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Added
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const lastOwner = member.role === "owner" && ownerCount < 2;

                return (
                  <tr key={member.userId} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 font-medium text-ink">
                      {member.email}
                    </th>
                    <td className="px-4 py-3 text-ink">
                      {member.role === "owner" ? "Owner" : "Admin"}
                    </td>
                    <td className="px-4 py-3 text-muted">{member.status ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{formatCreated(member.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => openReset(member)}
                          className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                        >
                          Reset Password
                        </button>
                        <button
                          type="button"
                          disabled={pending || lastOwner}
                          onClick={() => {
                            setRemoveError("");
                            setResetTarget(null);
                            setTarget(member);
                          }}
                          className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-accent-deep hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                      {lastOwner ? (
                        <p className="mt-2 max-w-xs text-xs leading-5 text-muted">
                          The last Owner cannot be removed. Add another Owner first.
                        </p>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {target ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-admin-title"
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lg"
          >
            <h2 id="remove-admin-title" className="font-display text-2xl text-ink">
              Remove this admin?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {target.email} will lose access to {shopName}. Their sign-in account stays in place.
            </p>
            {removeError ? (
              <p role="alert" className="mt-3 text-sm text-accent-deep">
                {removeError}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={pending}
                onClick={() => void confirmRemove()}
                className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
              >
                {pending ? "Removing…" : "Remove"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setTarget(null)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-background px-5 text-sm font-medium text-ink ring-1 ring-line hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {resetTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lg"
          >
            <h2 id="reset-password-title" className="font-display text-2xl text-ink">
              Reset Password
            </h2>
            <form className="mt-4 grid gap-3" onSubmit={(event) => void confirmReset(event)}>
              <p className="text-sm leading-6 text-muted">
                Email: <span className="font-medium text-ink">{resetTarget.email}</span>
              </p>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium tracking-[0.14em] text-muted uppercase">
                  New Password
                </span>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={nextPassword}
                  disabled={pending}
                  onChange={(event) => setNextPassword(event.target.value)}
                  className={fieldClassName}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium tracking-[0.14em] text-muted uppercase">
                  Confirm Password
                </span>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  disabled={pending}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={fieldClassName}
                />
              </label>
              {resetError ? (
                <p role="alert" className="text-sm text-accent-deep">
                  {resetError}
                </p>
              ) : null}
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                >
                  {pending ? "Resetting…" : "Reset Password"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setNextPassword("");
                    setConfirmPassword("");
                    setResetTarget(null);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-background px-5 text-sm font-medium text-ink ring-1 ring-line hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
