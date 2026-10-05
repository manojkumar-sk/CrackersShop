"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateProductPrices } from "@/app/(admin)/admin/(protected)/products/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import type { AdminCategory, AdminProduct } from "@/lib/admin";
import { discountPercent, formatInr } from "@/lib/money";

const fieldClassName =
  "h-11 w-full min-w-0 rounded-full border border-line bg-background px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-sm";

type SortKey = "name" | "mrp" | "price" | "discount";

export function PriceList({
  shopName,
  products,
  categories,
}: {
  shopName: string;
  products: AdminProduct[];
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("active");
  const [sort, setSort] = useState<SortKey>("name");
  const [target, setTarget] = useState<AdminProduct | null>(null);
  const [mrp, setMrp] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

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

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = products.filter((product) => {
      const matchesName = needle.length === 0 || product.name.toLowerCase().includes(needle);
      const matchesCategory = categoryId === "all" || product.categoryId === categoryId;
      const matchesStatus =
        status === "all" ||
        (status === "active" && product.active) ||
        (status === "inactive" && !product.active);
      return matchesName && matchesCategory && matchesStatus;
    });

    rows.sort((a, b) => {
      if (sort === "mrp") {
        return a.mrp - b.mrp || a.name.localeCompare(b.name);
      }

      if (sort === "price") {
        return a.price - b.price || a.name.localeCompare(b.name);
      }

      if (sort === "discount") {
        return (
          discountPercent(b.mrp, b.price) - discountPercent(a.mrp, a.price) ||
          a.name.localeCompare(b.name)
        );
      }

      return a.name.localeCompare(b.name);
    });

    return rows;
  }, [products, query, categoryId, status, sort]);

  const previewDiscount = discountPercent(Number(mrp), Number(price));
  const previewReady = /^\d+$/.test(mrp.trim()) && /^\d+$/.test(price.trim()) && Number(price) <= Number(mrp);

  function openEditor(product: AdminProduct) {
    setError("");
    setNotice("");
    setMrp(String(product.mrp));
    setPrice(String(product.price));
    setTarget(product);
  }

  async function savePrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!target || pending) {
      return;
    }

    setError("");
    setPending(true);
    const formData = new FormData();
    formData.set("mrp", mrp);
    formData.set("price", price);
    const result = await updateProductPrices(target.id, formData);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setTarget(null);
    setNotice("Prices saved.");
    router.refresh();
  }

  return (
    <div>
      <div className="hidden print:block">
        <h1 className="font-display text-3xl text-ink">{shopName}</h1>
        <p className="mt-1 text-sm text-ink">Price list</p>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">MRP</th>
              <th className="py-2 pr-3">Selling price</th>
              <th className="py-2">Discount</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((product) => {
              const discount = discountPercent(product.mrp, product.price);
              return (
                <tr key={product.id}>
                  <td className="py-1 pr-3">{product.name}</td>
                  <td className="py-1 pr-3">{product.categoryName}</td>
                  <td className="py-1 pr-3">{formatInr(product.mrp)}</td>
                  <td className="py-1 pr-3">{formatInr(product.price)}</td>
                  <td className="py-1">{discount > 0 ? `${discount}%` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print mt-6 inline-flex h-11 items-center justify-center rounded-full bg-background px-5 text-sm font-medium text-ink ring-1 ring-line"
        >
          Print price list
        </button>
        {notice ? (
          <p role="status" className="mt-6 text-sm text-ink">
            {notice}
          </p>
        ) : null}
        <form
          className="no-print mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium tracking-[0.14em] text-muted uppercase">
              Sort
            </span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className={fieldClassName}
            >
              <option value="name">Name</option>
              <option value="mrp">MRP</option>
              <option value="price">Selling price</option>
              <option value="discount">Discount</option>
            </select>
          </label>
        </form>
        {visible.length === 0 ? (
          <div className="mt-6">
            <AdminNotice title="No products match" message="Nothing matches that search or filter." />
          </div>
        ) : (
          <>
            <div className="mt-6 hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Price list</caption>
                <thead className="border-b border-line text-xs tracking-[0.14em] text-muted uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Product</th>
                    <th scope="col" className="px-4 py-3 font-medium">Category</th>
                    <th scope="col" className="px-4 py-3 font-medium">MRP</th>
                    <th scope="col" className="px-4 py-3 font-medium">Selling price</th>
                    <th scope="col" className="px-4 py-3 font-medium">Discount</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((product) => (
                    <PriceRow key={product.id} product={product} onEdit={() => openEditor(product)} />
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-6 grid gap-3 md:hidden">
              {visible.map((product) => {
                const discount = discountPercent(product.mrp, product.price);
                return (
                  <li key={product.id} className="rounded-2xl border border-line bg-surface p-4">
                    <p className="font-medium text-ink">{product.name}</p>
                    <p className="mt-1 text-sm text-muted">{product.categoryName}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-muted">MRP</dt>
                        <dd className="font-medium text-ink">{formatInr(product.mrp)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Selling price</dt>
                        <dd className="font-medium text-ink">{formatInr(product.price)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Discount</dt>
                        <dd className="font-medium text-ink">{discount > 0 ? `${discount}%` : "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Status</dt>
                        <dd className="font-medium text-ink">{product.active ? "Active" : "Inactive"}</dd>
                      </div>
                    </dl>
                    <button
                      type="button"
                      onClick={() => openEditor(product)}
                      className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-4 text-sm font-medium text-accent-foreground"
                    >
                      Edit price
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
      {target ? (
        <div className="no-print fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-price-title"
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lg"
          >
            <h2 id="edit-price-title" className="font-display text-2xl text-ink">
              Edit price
            </h2>
            <form className="mt-4 grid gap-3" onSubmit={(event) => void savePrice(event)}>
              <p className="text-sm leading-6 text-muted">
                Product: <span className="font-medium text-ink">{target.name}</span>
              </p>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">MRP</span>
                <input
                  inputMode="numeric"
                  required
                  value={mrp}
                  disabled={pending}
                  onChange={(event) => setMrp(event.target.value)}
                  className={fieldClassName}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Selling price</span>
                <input
                  inputMode="numeric"
                  required
                  value={price}
                  disabled={pending}
                  onChange={(event) => setPrice(event.target.value)}
                  className={fieldClassName}
                />
              </label>
              <p className="text-sm text-muted">
                Discount: {previewReady ? `${previewDiscount}%` : "Calculated from MRP and selling price."}
              </p>
              {error ? (
                <p role="alert" className="text-sm text-accent-deep">
                  {error}
                </p>
              ) : null}
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setTarget(null)}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-background px-5 text-sm font-medium text-ink ring-1 ring-line disabled:opacity-60"
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

function PriceRow({ product, onEdit }: { product: AdminProduct; onEdit: () => void }) {
  const discount = discountPercent(product.mrp, product.price);

  return (
    <tr className="border-b border-line last:border-b-0">
      <th scope="row" className="px-4 py-3 font-medium text-ink">
        {product.name}
      </th>
      <td className="px-4 py-3 text-ink">{product.categoryName}</td>
      <td className="px-4 py-3 text-ink tabular-nums">{formatInr(product.mrp)}</td>
      <td className="px-4 py-3 text-ink tabular-nums">{formatInr(product.price)}</td>
      <td className="px-4 py-3 text-ink">{discount > 0 ? `${discount}%` : "—"}</td>
      <td className="px-4 py-3 text-muted">{product.active ? "Active" : "Inactive"}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-ink hover:bg-surface"
        >
          Edit price
        </button>
      </td>
    </tr>
  );
}
