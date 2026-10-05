"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { ProductPrice } from "@/components/catalog/product-price";
import { ProductVisual } from "@/components/catalog/product-visual";
import { QuantitySelector } from "@/components/catalog/quantity-selector";
import { ImagePreview } from "@/components/ui/image-preview";
import { maxCartQuantity } from "@/lib/cart";
import { discountPercent } from "@/lib/money";
import type { Product } from "@/types/catalog";

export function ProductCard({
  product,
  layout = "card",
}: {
  product: Product;
  layout?: "card" | "list";
}) {
  const cart = useCart();
  const [capped, setCapped] = useState(false);
  const lastClick = useRef(0);
  const href = `/products/${product.id}`;
  const discount = discountPercent(product.mrp, product.price);
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

  if (layout === "list") {
    return (
      <article className="flex flex-col gap-3 overflow-hidden rounded-[1.6rem] border border-white/80 bg-white p-3 shadow-[0_16px_36px_-24px_rgba(36,18,28,0.45)] sm:flex-row sm:items-center sm:gap-5 sm:p-4">
        <div className="relative w-24 shrink-0 sm:w-28">
          <Link
            href={href}
            aria-label={`View ${product.name}`}
            className="block overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ProductVisual product={product} className="aspect-square" />
          </Link>
          {product.imageUrl ? (
            <ImagePreview
              src={product.imageUrl}
              alt={product.name}
              className="absolute bottom-1.5 left-1.5 z-10 inline-flex h-8 items-center rounded-full bg-white/95 px-2.5 text-xs font-semibold text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              View
            </ImagePreview>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-[0.16em] text-accent-strong uppercase">
            {product.categoryName}
          </p>
          <h3 className="mt-1 font-display text-xl leading-tight text-ink sm:text-2xl">
            <Link
              href={href}
              className="line-clamp-2 rounded-sm transition hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {product.name}
            </Link>
          </h3>
        </div>
        <div className="sm:w-36 sm:shrink-0">
          <ProductPrice mrp={product.mrp} price={product.price} showBadge={false} />
          {discount > 0 ? (
            <p className="mt-1 text-xs font-semibold tracking-wide text-accent-strong">
              {discount}% OFF
            </p>
          ) : null}
        </div>
        <div className="sm:w-44 sm:shrink-0">
          {quantity > 0 ? (
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
          ) : (
            <button
              type="button"
              disabled={!cart.ready}
              onClick={add}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent-strong px-4 text-sm font-semibold text-accent-foreground transition hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
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

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_16px_36px_-24px_rgba(36,18,28,0.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_40px_-20px_rgba(196,83,29,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="relative">
      <Link
        href={href}
        aria-label={`View ${product.name}`}
        className="relative block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ProductVisual
          product={product}
          className="aspect-square transition duration-300 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        {discount > 0 ? (
          <span className="absolute top-3 right-3 z-10 rounded-full bg-accent-strong px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            {discount}% OFF
          </span>
        ) : null}
      </Link>
      {product.imageUrl ? (
        <ImagePreview
          src={product.imageUrl}
          alt={product.name}
          className="absolute bottom-3 left-3 z-10 inline-flex h-9 items-center rounded-full bg-white/95 px-3 text-xs font-semibold text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          View
        </ImagePreview>
      ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent-strong uppercase">
          {product.categoryName}
        </p>
        <h3 className="mt-2 font-display text-2xl leading-tight text-balance text-ink">
          <Link
            href={href}
            className="rounded-sm transition hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {product.name}
          </Link>
        </h3>
        <div className="mt-3">
          <ProductPrice mrp={product.mrp} price={product.price} showBadge={false} />
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
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent-strong px-4 text-sm font-semibold text-accent-foreground transition hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
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
