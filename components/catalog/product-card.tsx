"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { ProductPrice } from "@/components/catalog/product-price";
import { ProductVisual } from "@/components/catalog/product-visual";
import { QuantitySelector } from "@/components/catalog/quantity-selector";
import { maxCartQuantity } from "@/lib/cart";
import type { Product } from "@/types/catalog";

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const [capped, setCapped] = useState(false);
  const lastClick = useRef(0);
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

  function setQuantity(next: number) {
    cart.updateQuantity(product.id, next);
    setCapped(next >= maxCartQuantity);
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_10px_30px_-18px_rgba(36,28,24,0.45)] transition duration-200 hover:-translate-y-0.5 hover:border-gold/80 hover:shadow-[0_16px_36px_-18px_rgba(154,53,24,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
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
          <ProductPrice mrp={product.mrp} price={product.price} />
        </div>
        {quantity > 0 ? (
          <div className="mt-5">
            <QuantitySelector
              fullWidth
              productName={product.name}
              value={quantity}
              max={maxCartQuantity}
              onChange={setQuantity}
              onRemove={() => {
                setCapped(false);
                cart.removeItem(product.id);
              }}
            />
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
            You can add up to {maxCartQuantity} of this cracker.
          </p>
        ) : null}
      </div>
    </article>
  );
}
