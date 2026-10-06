"use client";

import { useMemo, useState } from "react";
import { ProductTable } from "@/components/catalog/product-table";
import { discountPercent } from "@/lib/money";
import type { Category, Product } from "@/types/catalog";

type SortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "discount-desc"
  | "name-asc";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "discount-desc", label: "Discount: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
];

const fieldClassName =
  "h-11 w-full min-w-0 rounded-full border border-line bg-surface px-4 text-base text-ink transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-sm";

export function ProductBrowser({
  products,
  categories,
  featuredIds,
  initialCategoryId = "all",
  syncUrl = true,
}: {
  products: Product[];
  categories: Category[];
  featuredIds: string[];
  initialCategoryId?: string;
  syncUrl?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState(
    categories.some((category) => category.id === initialCategoryId)
      ? initialCategoryId
      : "all",
  );
  const [sort, setSort] = useState<SortOption>("featured");

  const visibleProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const categoryName = categories.find(
      (category) => category.id === categoryId,
    )?.name;

    const filtered = products.filter((product) => {
      const matchesName =
        needle.length === 0 || product.name.toLowerCase().includes(needle);
      const matchesCategory =
        categoryId === "all" || product.categoryName === categoryName;

      return matchesName && matchesCategory;
    });

    const featuredRank = new Map(
      featuredIds.map((id, index) => [id, index]),
    );
    const sorted = [...filtered];

    if (sort === "featured") {
      sorted.sort((a, b) => {
        const aRank = featuredRank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bRank = featuredRank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return aRank - bRank;
      });
    } else if (sort === "price-asc") {
      sorted.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    } else if (sort === "price-desc") {
      sorted.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
    } else if (sort === "discount-desc") {
      sorted.sort(
        (a, b) =>
          discountPercent(b.mrp, b.price) - discountPercent(a.mrp, a.price) ||
          a.name.localeCompare(b.name),
      );
    } else if (sort === "name-asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  }, [products, categories, featuredIds, query, categoryId, sort]);

  const groups = useMemo(() => {
    const byName = new Map<string, Product[]>();

    for (const product of visibleProducts) {
      const list = byName.get(product.categoryName) ?? [];
      list.push(product);
      byName.set(product.categoryName, list);
    }

    const ordered: { name: string; products: Product[] }[] = [];

    for (const category of categories) {
      const list = byName.get(category.name);

      if (list && list.length > 0) {
        ordered.push({ name: category.name, products: list });
        byName.delete(category.name);
      }
    }

    for (const [name, list] of byName) {
      if (list.length > 0) {
        ordered.push({ name, products: list });
      }
    }

    return ordered;
  }, [visibleProducts, categories]);

  const filtersActive =
    query.trim().length > 0 || categoryId !== "all" || sort !== "featured";

  function chooseCategory(next: string) {
    setCategoryId(next);

    if (!syncUrl) {
      return;
    }

    const url = new URL(window.location.href);

    if (next === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", next);
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  function clearFilters() {
    setQuery("");
    chooseCategory("all");
    setSort("featured");
  }

  return (
    <div>
      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
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
            autoComplete="off"
            className={fieldClassName}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium tracking-[0.14em] text-muted uppercase">
            Sort
          </span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className={fieldClassName}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </form>
      <div className="mt-4 max-w-full min-w-0 overflow-x-auto overscroll-x-contain">
        <div className="flex w-max min-w-full gap-2 pb-1" role="tablist" aria-label="Categories">
          <CategoryChip
            selected={categoryId === "all"}
            label="All products"
            count={products.length}
            onClick={() => chooseCategory("all")}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              selected={categoryId === category.id}
              label={category.name}
              count={category.productCount}
              imageUrl={category.imageUrl}
              onClick={() => chooseCategory(category.id)}
            />
          ))}
        </div>
      </div>
      <p aria-live="polite" className="mt-4 text-sm text-muted">
        {visibleProducts.length}{" "}
        {visibleProducts.length === 1 ? "cracker" : "crackers"}
      </p>
      {visibleProducts.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <h2 className="font-display text-2xl text-ink">No crackers match</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {`Nothing on the shelf matches that name${
              categoryId !== "all" ? " in this category" : ""
            }. Try another word, or clear the filters.`}
          </p>
          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground transition hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 flex min-w-0 flex-col gap-6">
          {groups.map((group) => (
            <ProductTable
              key={group.name}
              categoryName={group.name}
              products={group.products}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  selected,
  label,
  count,
  imageUrl,
  onClick,
}: {
  selected: boolean;
  label: string;
  count?: number;
  imageUrl?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`inline-flex h-12 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        selected
          ? "border-ink bg-ink text-background"
          : "border-line bg-white text-ink hover:border-accent-strong"
      }`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- category photos use the stored public URL
        <img src={imageUrl} alt="" className="size-7 rounded-full object-cover" />
      ) : null}
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className={selected ? "text-background/70" : "text-muted"}>{count}</span>
      ) : null}
    </button>
  );
}
