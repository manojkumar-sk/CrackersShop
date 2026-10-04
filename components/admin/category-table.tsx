"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { deleteCategory } from "@/app/(admin)/admin/(protected)/categories/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import type { AdminCategory } from "@/lib/admin";

const fieldClassName =
  "h-11 w-full min-w-0 rounded-full border border-line bg-background px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-sm";

const notices: Record<string, string> = {
  created: "Category saved.",
  updated: "Category updated.",
  deleted: "Category deleted.",
};

const productsRemain =
  "This category contains products. Move or delete those products before deleting the category.";

export function CategoryTable({
  categories,
  notice,
}: {
  categories: AdminCategory[];
  notice?: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [target, setTarget] = useState<AdminCategory | null>(null);
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

    return categories.filter((category) => {
      const matchesName =
        needle.length === 0 || category.name.toLowerCase().includes(needle);
      const matchesStatus =
        status === "all" ||
        (status === "active" && category.active) ||
        (status === "inactive" && !category.active);

      return matchesName && matchesStatus;
    });
  }, [categories, query, status]);

  const filtersActive = query.trim().length > 0 || status !== "all";
  const blocked = (target?.productCount ?? 0) > 0;

  async function confirmDelete() {
    if (!target || blocked || pending) {
      return;
    }

    const categoryId = target.id;
    setPending(true);
    setDeleteError("");

    try {
      const result = await deleteCategory(categoryId);

      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }

      setTarget(null);
      setFlash("deleted");
    } catch {
      setDeleteError("We could not delete this category. Please try again.");
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
        className="mt-8 grid gap-3 sm:grid-cols-2"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="block">
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
            title={filtersActive ? "No categories match" : "No categories yet"}
            message={
              filtersActive
                ? "Nothing matches that search or filter."
                : "Categories will show here once they are in the catalogue."
            }
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <caption className="sr-only">Catalogue categories</caption>
            <thead className="border-b border-line text-xs tracking-[0.14em] text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Image
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Slug
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Products
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
              {visible.map((category) => (
                <tr key={category.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    {category.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- thumbnails use the stored public image URL
                      <img
                        src={category.imageUrl}
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
                    {category.name}
                  </th>
                  <td className="px-4 py-3 text-muted">{category.slug}</td>
                  <td className="px-4 py-3 text-muted">{category.productCount}</td>
                  <td className="px-4 py-3 text-ink">
                    {category.active ? "Active" : "Inactive"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError("");
                          setTarget(category);
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
            aria-labelledby="delete-category-title"
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lg"
          >
            <h2 id="delete-category-title" className="font-display text-2xl text-ink">
              {blocked ? "This category has products" : "Delete this category?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {blocked
                ? productsRemain
                : `Are you sure you want to delete ${target.name}? This cannot be undone.`}
            </p>
            {deleteError ? (
              <p role="alert" className="mt-3 text-sm text-accent-deep">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {blocked ? null : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void confirmDelete()}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                >
                  {pending ? "Deleting…" : "Delete"}
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => setTarget(null)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-background px-5 text-sm font-medium text-ink ring-1 ring-line hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
              >
                {blocked ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
