"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { ProductVisual } from "@/components/catalog/product-visual";
import { ProductPrice } from "@/components/catalog/product-price";
import { QuantitySelector } from "@/components/catalog/quantity-selector";
import { ButtonLink } from "@/components/ui/button-link";
import { maxCartQuantity } from "@/lib/cart";
import type { Category, Product } from "@/types/catalog";

export function ProductDetail({
  product,
  category,
}: {
  product: Product;
  category?: Category;
}) {
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [capped, setCapped] = useState(false);
  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link
              href="/"
              className="rounded-sm hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/products"
              className="rounded-sm hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              All crackers
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
        <ProductVisual
          product={product}
          className="aspect-square rounded-[1.75rem] ring-4 ring-gold/70 sm:aspect-[4/5] lg:aspect-square"
        />
        <div className="min-w-0 rounded-[1.75rem] border border-line bg-surface p-5 sm:p-8">
          {category ? (
            <Link
              href={`/categories/${category.id}`}
              className="text-xs font-medium tracking-[0.14em] text-muted uppercase hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {category.name}
            </Link>
          ) : (
            <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">
              {product.categoryName}
            </p>
          )}
          <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight text-balance text-ink sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted">
            {product.description}
          </p>
          <div className="mt-6">
            <ProductPrice mrp={product.mrp} price={product.price} size="detail" />
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <QuantitySelector
              productName={product.name}
              value={quantity}
              max={maxCartQuantity}
              onChange={setQuantity}
            />
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
                  quantity,
                });
                setAdded(true);
                setCapped(result.capped);
              }}
              className={`inline-flex h-12 w-full items-center justify-center rounded-full px-5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto sm:min-w-44 ${
                added
                  ? "bg-background text-ink ring-1 ring-line"
                  : "bg-accent-strong text-accent-foreground hover:bg-accent-deep"
              }`}
            >
              <span aria-live="polite">{added ? "Added" : "Add to Cart"}</span>
            </button>
          </div>
          {added ? (
            <p className="mt-3 text-sm text-muted" role="status">
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
            <p className="mt-2 text-sm text-muted">
              You can add up to {maxCartQuantity} of this cracker.
            </p>
          ) : null}
          <div className="mt-6">
            <ButtonLink href="/products" variant="secondary">
              Back to all crackers
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
