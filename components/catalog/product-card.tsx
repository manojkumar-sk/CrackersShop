"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { ProductVisual } from "@/components/catalog/product-visual";
import { discountPercent, formatInr } from "@/lib/money";
import type { Product } from "@/types/catalog";

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const [added, setAdded] = useState(false);
  const [capped, setCapped] = useState(false);
  const discount = discountPercent(product.mrp, product.price);
  const href = `/products/${product.id}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link
        href={href}
        aria-label={`View ${product.name}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ProductVisual product={product} />
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">
          {product.categoryName}
        </p>
        <h3 className="mt-2 font-display text-xl leading-tight text-balance text-ink">
          <Link
            href={href}
            className="rounded-sm transition hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted">{product.summary}</p>
        <div className="mt-4">
          <p className="text-sm text-muted line-through">
            <span className="sr-only">Marked price </span>
            MRP {formatInr(product.mrp)}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-xl font-semibold text-ink tabular-nums">
              <span className="sr-only">Selling price </span>
              {formatInr(product.price)}
            </p>
            {discount > 0 ? (
              <p className="text-sm font-semibold text-accent-strong">
                {discount}% OFF
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          aria-pressed={added}
          onClick={() => {
            const result = cart.addItem({
              id: product.id,
              slug: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              quantity: 1,
            });
            setAdded(true);
            setCapped(result.capped);
          }}
          className={`mt-5 inline-flex h-11 w-full items-center justify-center rounded-full px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            added
              ? "bg-background text-ink ring-1 ring-line"
              : "bg-accent-strong text-accent-foreground hover:bg-accent-deep"
          }`}
        >
          <span aria-live="polite">{added ? "Added" : "Add to Cart"}</span>
        </button>
        {added ? (
          <p className="mt-2 text-center text-sm text-muted">
            Added to cart.{" "}
            <Link
              href="/cart"
              className="font-medium text-ink underline decoration-line underline-offset-4 hover:text-accent-strong"
            >
              View cart
            </Link>
          </p>
        ) : null}
        {capped ? (
          <p className="mt-2 text-center text-sm text-muted">
            You can add up to 20 of this cracker.
          </p>
        ) : null}
      </div>
    </article>
  );
}
