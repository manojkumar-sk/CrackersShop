"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  addCrackerStoreAdmin,
  removeCrackerStoreAdmin,
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
  const [role, setRole] = useState<"admin" | "owner">("admin");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [target, setTarget] = useState<ShopAdminRecord | null>(null);
  const [removeError, setRemoveError] = useState("");
  const ownerCount = members.filter((member) => member.role === "owner").length;

  useEffect(() => {
    if (!target) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        setTarget(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pending, target]);

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setPending(true);
    const formData = new FormData();
    formData.set("email", email);
    formData.set("role", role);
    const result = await addCrackerStoreAdmin(formData);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setNotice(
      result.outcome === "reinvited"
        ? "Invitation sent. They will join this shop after they accept it."
        : "Invitation sent. They can set a password from the email, then sign in.",
    );
    setEmail("");
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

  return (
    <div>
      <div className="mt-8">
        {form.isOpen ? (
          <form className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]" onSubmit={onAdd}>
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
              className="inline-flex h-11 items-center justify-center self-end rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
            >
              {pending ? "Sending invite…" : "Add Admin"}
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
        New staff are usually Admins. An invitation email lets them set a password and sign in
        to manage {shopName}. Choosing Owner is only for someone who should manage this list.
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
                      <button
                        type="button"
                        disabled={pending || lastOwner}
                        onClick={() => {
                          setRemoveError("");
                          setTarget(member);
                        }}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-accent-deep hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                      >
                        Remove
                      </button>
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
    </div>
  );
}
