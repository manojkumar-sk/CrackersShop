"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
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
}: {
  products: Product[];
  categories: Category[];
  featuredIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
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

  const filtersActive =
    query.trim().length > 0 || categoryId !== "all" || sort !== "featured";

  function clearFilters() {
    setQuery("");
    setCategoryId("all");
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
        <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
