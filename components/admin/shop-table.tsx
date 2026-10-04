"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setShopActive, type PlatformShop } from "@/app/(admin)/admin/(protected)/shops/actions";

const notices: Record<string, string> = {
  created: "Shop created.",
  updated: "Shop updated.",
};

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

export function ShopTable({
  shops,
  notice,
}: {
  shops: PlatformShop[];
  notice?: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggle(shop: PlatformShop) {
    setPendingId(shop.id);
    setError("");
    const result = await setShopActive(shop.id, !shop.active);
    setPendingId(null);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      {notice && notices[notice] ? (
        <p
          role="status"
          className="mt-6 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink"
        >
          {notices[notice]}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-6 text-sm text-accent-deep">
          {error}
        </p>
      ) : null}
      {shops.length === 0 ? (
        <p className="mt-8 text-sm leading-6 text-muted">No shops yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <caption className="sr-only">Shops</caption>
            <thead className="border-b border-line text-xs tracking-[0.14em] text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Shop
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Slug
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  WhatsApp
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Created
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Owners
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <tr key={shop.id} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-4 py-3 font-medium text-ink">
                    {shop.name}
                  </th>
                  <td className="px-4 py-3 text-muted">{shop.slug}</td>
                  <td className="px-4 py-3 text-ink">
                    {shop.active ? "Active" : "Inactive"}
                  </td>
                  <td className="px-4 py-3 text-muted">{shop.whatsappNumber ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{formatCreated(shop.createdAt)}</td>
                  <td className="px-4 py-3 text-muted">{shop.ownerCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/shops/${shop.id}/edit`}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={pendingId === shop.id}
                        onClick={() => void toggle(shop)}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                      >
                        {pendingId === shop.id
                          ? "Saving…"
                          : shop.active
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                      <Link
                        href={`/admin/shops/${shop.id}/members`}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Members
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
