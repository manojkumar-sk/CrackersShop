"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { ProductVisual } from "@/components/catalog/product-visual";
import { maxCartQuantity } from "@/lib/cart";
import { discountPercent, formatInr } from "@/lib/money";
import type { Product } from "@/types/catalog";

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const [capped, setCapped] = useState(false);
  const lastClick = useRef(0);
  const discount = discountPercent(product.mrp, product.price);
  const href = `/products/${product.id}`;
  const quantity = cart.ready
    ? (cart.items.find((item) => item.slug === product.id)?.quantity ?? 0)
    : 0;

  function allowClick() {
    const now = Date.now();

    if (now - lastClick.current < 280) {
      return false;
    }

    lastClick.current = now;
    return true;
  }

  function add() {
    if (!allowClick()) {
      return;
    }

    const result = cart.addItem({
      id: product.id,
      slug: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
    });
    setCapped(result.capped);
  }

  function increase() {
    if (!allowClick()) {
      return;
    }

    if (quantity >= maxCartQuantity) {
      setCapped(true);
      return;
    }

    cart.updateQuantity(product.id, quantity + 1);
    setCapped(false);
  }

  function decrease() {
    if (!allowClick() || quantity < 1) {
      return;
    }

    setCapped(false);

    if (quantity <= 1) {
      cart.removeItem(product.id);
      return;
    }

    cart.updateQuantity(product.id, quantity - 1);
  }

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
        {quantity > 0 ? (
          <div
            className="mt-5 inline-flex h-11 w-full items-center justify-between rounded-full border border-line bg-background"
            role="group"
            aria-label={`Quantity for ${product.name}`}
          >
            <button
              type="button"
              aria-label={`Decrease quantity of ${product.name}`}
              onClick={decrease}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-lg text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              −
            </button>
            <span className="min-w-8 text-center text-sm font-medium text-ink tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${product.name}`}
              disabled={quantity >= maxCartQuantity}
              onClick={increase}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-lg text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!cart.ready}
            onClick={add}
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-accent-strong px-4 text-sm font-medium text-accent-foreground transition hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
          >
            Add to Cart
          </button>
        )}
        {capped ? (
          <p className="mt-2 text-center text-sm text-muted">
            You can add up to 20 of this cracker.
          </p>
        ) : null}
      </div>
    </article>
  );
}
