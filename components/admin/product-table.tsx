"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminNotice } from "@/components/admin/admin-notice";
import { deleteProduct } from "@/app/(admin)/admin/(protected)/products/actions";
import type { AdminCategory, AdminProduct } from "@/lib/admin";
import { formatInr } from "@/lib/money";

const fieldClassName =
  "h-11 w-full min-w-0 rounded-full border border-line bg-background px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-sm";

const notices: Record<string, string> = {
  created: "Product saved.",
  updated: "Product updated.",
  deleted: "Product deleted.",
};

export function ProductTable({
  products,
  categories,
  notice,
}: {
  products: AdminProduct[];
  categories: AdminCategory[];
  notice?: string;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");
  const [target, setTarget] = useState<AdminProduct | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState("");

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
  }, [target, pending]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesName =
        needle.length === 0 || product.name.toLowerCase().includes(needle);
      const matchesCategory =
        categoryId === "all" || product.categoryId === categoryId;
      const matchesStatus =
        status === "all" ||
        (status === "active" && product.active) ||
        (status === "inactive" && !product.active);

      return matchesName && matchesCategory && matchesStatus;
    });
  }, [products, query, categoryId, status]);

  const filtersActive =
    query.trim().length > 0 || categoryId !== "all" || status !== "all";

  async function confirmDelete() {
    if (!target || pending) {
      return;
    }

    const productId = target.id;
    setPending(true);
    setDeleteError("");

    try {
      const result = await deleteProduct(productId);

      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }

      setTarget(null);
      setFlash("deleted");
    } catch {
      setDeleteError("We could not delete this product. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      {(flash || notice) && notices[flash || notice || ""] ? (
        <p
          role="status"
          className="mt-6 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink"
        >
          {notices[flash || notice || ""]}
        </p>
      ) : null}
      <form
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="mb-1.5 block text-xs font-medium tracking-[0.14em] text-muted uppercase">
            Search
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name"
            className={fieldClassName}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium tracking-[0.14em] text-muted uppercase">
            Category
          </span>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={fieldClassName}
          >
            <option value="all">All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium tracking-[0.14em] text-muted uppercase">
            Status
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={fieldClassName}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </form>
      {visible.length === 0 ? (
        <div className="mt-6">
          <AdminNotice
            title={filtersActive ? "No products match" : "No products yet"}
            message={
              filtersActive
                ? "Nothing matches that search or filter."
                : "Products will show here once they are in the catalogue."
            }
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <caption className="sr-only">Catalogue products</caption>
            <thead className="border-b border-line text-xs tracking-[0.14em] text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Image
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Product
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  MRP
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Selling price
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Discount
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Stock
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((product) => (
                <tr key={product.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- thumbnails use the stored public image URL
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="size-12 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="grid size-12 place-items-center rounded-lg bg-background text-[10px] text-muted">
                        None
                      </span>
                    )}
                  </td>
                  <th scope="row" className="px-4 py-3 font-medium text-ink">
                    {product.name}
                  </th>
                  <td className="px-4 py-3 text-muted">{product.categoryName}</td>
                  <td className="px-4 py-3 text-muted">{formatInr(product.mrp)}</td>
                  <td className="px-4 py-3 text-ink">{formatInr(product.price)}</td>
                  <td className="px-4 py-3 text-muted">{product.discount}%</td>
                  <td className="px-4 py-3 text-muted">{product.stock}</td>
                  <td className="px-4 py-3 text-ink">
                    {product.active ? "Active" : "Inactive"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError("");
                          setTarget(product);
                        }}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-accent-deep hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {target ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lg"
          >
            <h2 id="delete-product-title" className="font-display text-2xl text-ink">
              Delete this product?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Are you sure you want to delete {target.name}? This cannot be undone.
            </p>
            {deleteError ? (
              <p role="alert" className="mt-3 text-sm text-accent-deep">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={pending}
                onClick={() => void confirmDelete()}
                className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
              >
                {pending ? "Deleting…" : "Delete"}
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
