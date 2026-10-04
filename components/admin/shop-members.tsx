"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  addShopMember,
  removeShopMember,
  setShopMemberRole,
  type ShopMemberRecord,
} from "@/app/(admin)/admin/(protected)/shops/actions";

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

export function ShopMembers({
  shopId,
  shopName,
  members,
}: {
  shopId: string;
  shopName: string;
  members: ShopMemberRecord[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "admin">("admin");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const ownerCount = members.filter((member) => member.role === "owner").length;

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setPending(true);
    const formData = new FormData();
    formData.set("email", email);
    formData.set("role", role);
    const result = await addShopMember(shopId, formData);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setNotice(
      result.outcome === "reinvited"
        ? "Invitation sent. They will join this shop after they accept it."
        : "Invitation sent and member added.",
    );
    setEmail("");
    router.refresh();
  }

  async function changeRole(member: ShopMemberRecord) {
    const nextRole = member.role === "owner" ? "admin" : "owner";
    setError("");
    setPending(true);
    const result = await setShopMemberRole(shopId, member.userId, nextRole);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.refresh();
  }

  async function remove(member: ShopMemberRecord) {
    setError("");
    setPending(true);
    const result = await removeShopMember(shopId, member.userId);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <form className="mt-8 grid gap-3 sm:grid-cols-[1fr_10rem_auto]" onSubmit={onAdd}>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium tracking-[0.14em] text-muted uppercase">
            Account email
          </span>
          <input
            type="email"
            required
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
            onChange={(event) => setRole(event.target.value === "admin" ? "admin" : "owner")}
            className={fieldClassName}
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center self-end rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        >
          {pending ? "Sending invite..." : "Send Invite"}
        </button>
      </form>
      <p className="mt-3 text-sm leading-6 text-muted">
        A new email receives an invite for {shopName}. Someone who was removed receives a new invite and joins only after they accept it.
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
        <p className="mt-8 text-sm leading-6 text-muted">This shop has no members yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Shop members</caption>
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
                const onlyOwner = member.role === "owner" && ownerCount < 2;

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
                          disabled={pending || onlyOwner}
                          onClick={() => void changeRole(member)}
                          className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                        >
                          {member.role === "owner" ? "Make admin" : "Make owner"}
                        </button>
                        <button
                          type="button"
                          disabled={pending || onlyOwner}
                          onClick={() => void remove(member)}
                          className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-accent-deep hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                      {onlyOwner ? (
                        <p className="mt-2 text-xs leading-5 text-muted">
                          Assign another owner before removing or changing this one.
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
    </div>
  );
}
