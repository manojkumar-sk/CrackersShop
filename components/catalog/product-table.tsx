"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { ImagePreview } from "@/components/ui/image-preview";
import { maxCartQuantity } from "@/lib/cart";
import { discountPercent, formatInr } from "@/lib/money";
import type { Product } from "@/types/catalog";

export function ProductTable({
  categoryName,
  products,
}: {
  categoryName: string;
  products: Product[];
}) {
  const headingId = useId();

  return (
    <section className="min-w-0">
      <h2
        id={headingId}
        className="bg-accent-strong px-2 py-2 text-center font-display text-base tracking-[0.12em] text-accent-foreground uppercase sm:text-xl"
      >
        {categoryName}
      </h2>
      <table
        aria-labelledby={headingId}
        className="w-full table-fixed border-collapse border border-line bg-white text-left text-[11px] text-ink sm:text-sm"
      >
        <colgroup>
          <col className="w-9 sm:w-16" />
          <col />
          <col className="w-12 sm:w-28" />
          <col className="w-[2.625rem] sm:w-24" />
          <col className="w-16 sm:w-32" />
          <col className="w-12 sm:w-28" />
        </colgroup>
        <thead className="bg-gold text-ink">
          <tr>
            <th className="border border-line px-0 py-1.5 text-center text-[9px] leading-tight font-semibold break-words sm:px-2 sm:py-2 sm:text-xs">
              Image
            </th>
            <th className="border border-line px-1 py-1.5 text-[9px] leading-tight font-semibold break-words sm:px-3 sm:py-2 sm:text-xs">
              Product Name
            </th>
            <th className="border border-line px-0 py-1.5 text-center text-[9px] leading-tight font-semibold break-words sm:px-2 sm:py-2 sm:text-xs">
              Rate (₹)
            </th>
            <th className="border border-line px-0 py-1.5 text-center text-[9px] leading-tight font-semibold break-words sm:px-2 sm:py-2 sm:text-xs">
              Content
            </th>
            <th className="border border-line px-0 py-1.5 text-center text-[9px] leading-tight font-semibold sm:px-2 sm:py-2 sm:text-xs">
              Qty
            </th>
            <th className="border border-line px-0 py-1.5 text-center text-[9px] leading-tight font-semibold break-words sm:px-2 sm:py-2 sm:text-xs">
              Cost (₹)
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ProductRow({ product }: { product: Product }) {
  const cart = useCart();
  const quantity = cart.ready
    ? (cart.items.find((item) => item.slug === product.id)?.quantity ?? 0)
    : 0;
  const discount = discountPercent(product.mrp, product.price);
  const href = `/products/${product.id}`;

  return (
    <tr className="odd:bg-white even:bg-[#fffaf3]">
      <td className="border border-line px-0.5 py-1 text-center align-middle sm:px-2 sm:py-1.5">
        {product.imageUrl ? (
          <ImagePreview
            src={product.imageUrl}
            alt={product.name}
            className="mx-auto grid h-8 w-8 place-items-center sm:h-12 sm:w-12"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- catalogue photos are public storage URLs */}
            <img
              src={product.imageUrl}
              alt=""
              className="h-8 w-8 object-contain sm:h-12 sm:w-12"
            />
          </ImagePreview>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="border border-line px-1 py-1 align-middle sm:px-3 sm:py-1.5">
        <Link
          href={href}
          className="block leading-snug font-medium break-words text-ink hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {product.name}
        </Link>
      </td>
      <td className="border border-line px-0.5 py-1 text-center align-middle tabular-nums sm:px-2">
        {discount > 0 ? (
          <span className="block text-[10px] leading-tight text-muted line-through sm:text-xs">
            <span className="sr-only">Marked price </span>
            {formatInr(product.mrp)}
          </span>
        ) : null}
        <span className="block leading-tight font-semibold">
          <span className="sr-only">Selling price </span>
          {formatInr(product.price)}
        </span>
      </td>
      <td className="border border-line px-0.5 py-1 text-center align-middle text-muted">
        <span aria-hidden="true">—</span>
        <span className="sr-only">No pack content stored</span>
      </td>
      <td className="border border-line px-0.5 py-1 text-center align-middle">
        <TableQuantity product={product} quantity={quantity} ready={cart.ready} />
      </td>
      <td className="border border-line px-0.5 py-1 text-center align-middle leading-tight font-semibold tabular-nums sm:px-2">
        <span className="sr-only">Line cost </span>
        {formatInr(product.price * quantity)}
      </td>
    </tr>
  );
}

function TableQuantity({
  product,
  quantity,
  ready,
}: {
  product: Product;
  quantity: number;
  ready: boolean;
}) {
  const cart = useCart();
  const [draft, setDraft] = useState<string | null>(null);
  const [capped, setCapped] = useState(false);
  const lastClick = useRef(0);
  const shown = draft ?? String(quantity);

  function allowClick() {
    const now = Date.now();

    if (now - lastClick.current < 280) {
      return false;
    }

    lastClick.current = now;
    return true;
  }

  function add(amount: number) {
    if (!allowClick()) {
      return;
    }

    const result = cart.addItem({
      id: product.id,
      slug: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: amount,
    });
    setCapped(result.capped);
  }

  function setQuantity(next: number) {
    if (next <= 0) {
      setCapped(false);
      cart.removeItem(product.id);
      return;
    }

    if (quantity === 0) {
      add(Math.min(maxCartQuantity, next));
      return;
    }

    cart.updateQuantity(product.id, next);
    setCapped(next >= maxCartQuantity);
  }

  function commit(raw: string) {
    const trimmed = raw.trim();
    setDraft(null);

    if (!/^\d+$/.test(trimmed)) {
      return;
    }

    setQuantity(Number(trimmed));
  }

  return (
    <div className="inline-flex max-w-full flex-col items-center">
      <div
        className="inline-flex h-7 items-center rounded-md border border-line bg-white sm:h-8"
        role="group"
        aria-label={`Quantity for ${product.name}`}
      >
        <button
          type="button"
          disabled={!ready || quantity <= 0}
          aria-label={`Decrease quantity of ${product.name}`}
          onClick={() => {
            setDraft(null);
            setQuantity(quantity - 1);
          }}
          className="inline-flex h-7 w-5 items-center justify-center text-sm text-ink hover:bg-[#fffaf3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 sm:h-8 sm:w-7"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={maxCartQuantity}
          step={1}
          value={shown}
          disabled={!ready}
          aria-label={`Quantity of ${product.name}`}
          className="h-7 w-5 border-0 bg-transparent text-center text-[11px] font-medium text-ink tabular-nums [appearance:textfield] focus:outline-none disabled:opacity-40 sm:h-8 sm:w-8 sm:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          onChange={(event) => {
            const next = event.target.value;

            if (next === "" || /^\d+$/.test(next)) {
              setDraft(next);
            }
          }}
          onBlur={() => commit(shown)}
          onKeyDown={(event) => {
            if (
              event.key === "e" ||
              event.key === "E" ||
              event.key === "+" ||
              event.key === "-" ||
              event.key === "."
            ) {
              event.preventDefault();
            }

            if (event.key === "Enter") {
              event.preventDefault();
              commit(shown);
            }
          }}
        />
        <button
          type="button"
          disabled={!ready || quantity >= maxCartQuantity}
          aria-label={
            quantity === 0
              ? `Add ${product.name} to cart`
              : `Increase quantity of ${product.name}`
          }
          onClick={() => {
            setDraft(null);

            if (quantity === 0) {
              add(1);
              return;
            }

            setQuantity(quantity + 1);
          }}
          className="inline-flex h-7 w-5 items-center justify-center text-sm text-ink hover:bg-[#fffaf3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 sm:h-8 sm:w-7"
        >
          +
        </button>
      </div>
      {capped ? (
        <p className="mt-0.5 max-w-full text-[9px] leading-tight text-muted sm:text-[11px]">
          Max {maxCartQuantity}
        </p>
      ) : null}
    </div>
  );
}
