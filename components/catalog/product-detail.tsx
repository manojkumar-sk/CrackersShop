"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { ProductVisual } from "@/components/catalog/product-visual";
import { QuantitySelector } from "@/components/catalog/quantity-selector";
import { ButtonLink } from "@/components/ui/button-link";
import { discountPercent, formatInr } from "@/lib/money";
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
  const discount = discountPercent(product.mrp, product.price);

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
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductVisual
          product={product}
          className="aspect-square rounded-2xl sm:aspect-[4/3]"
        />
        <div className="min-w-0">
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
          <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight text-balance text-ink sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted">
            {product.description}
          </p>
          <div className="mt-6">
            <p className="text-sm text-muted line-through">
              <span className="sr-only">Marked price </span>
              MRP {formatInr(product.mrp)}
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-3xl font-semibold text-ink tabular-nums">
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
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <QuantitySelector
              productName={product.name}
              value={quantity}
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
              className={`inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto sm:min-w-40 ${
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
              You can add up to 20 of this cracker.
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
