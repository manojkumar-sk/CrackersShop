"use client";

import { useEffect, useState } from "react";
import { quoteCart } from "@/app/(storefront)/cart/quote";
import { useCart } from "@/components/cart/cart-provider";
import { QuantitySelector } from "@/components/catalog/quantity-selector";
import { ButtonLink } from "@/components/ui/button-link";
import {
  cartSubtotal,
  maxCartQuantity,
  meetsMinimumOrder,
  minimumOrderShortfall,
  minimumOrderValue,
} from "@/lib/cart";
import { parseCheckoutDetails } from "@/lib/checkout";
import { formatInr } from "@/lib/money";
import { downloadOrderPdf } from "@/lib/order-pdf";
import { primaryWhatsAppNumber, type ShopPhone } from "@/lib/shop-phones";
import { whatsAppOrderUrl } from "@/lib/whatsapp-order";

const fieldClassName =
  "h-11 w-full min-w-0 rounded-full border border-line bg-surface px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function CartView({
  phones,
  shopName,
  logoUrl,
}: {
  phones: ShopPhone[];
  shopName: string;
  logoUrl: string | null;
}) {
  const whatsappNumber = primaryWhatsAppNumber(phones);
  const cart = useCart();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [priceNotice, setPriceNotice] = useState("");
  const [blocked, setBlocked] = useState<string[]>([]);
  const [opened, setOpened] = useState(false);
  const [pending, setPending] = useState(false);
  const [pdfPending, setPdfPending] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!confirmClear) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConfirmClear(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmClear]);

  if (!cart.ready) {
    return (
      <p role="status" className="mt-8 text-sm text-muted">
        Loading cart
      </p>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
        <h2 className="font-display text-2xl text-ink">Your cart is empty</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Add crackers from the shelf, then come back here to send the order on
          WhatsApp.
        </p>
        <div className="mt-6">
          <ButtonLink href="/products">Continue Shopping</ButtonLink>
        </div>
      </div>
    );
  }

  const blockedItems = cart.items.filter((item) => blocked.includes(item.slug));
  const meetsMinimum = meetsMinimumOrder(cart.subtotal);
  const shortfall = minimumOrderShortfall(cart.subtotal);

  async function downloadPdf() {
    setError("");

    if (!meetsMinimumOrder(cart.subtotal)) {
      setError(
        `Minimum order value is ${formatInr(minimumOrderValue)}. Add ${formatInr(minimumOrderShortfall(cart.subtotal))} more to place this order.`,
      );
      return;
    }

    const parsed = parseCheckoutDetails({ name, mobile, address, note });

    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }

    setPdfPending(true);

    try {
      await downloadOrderPdf({
        shopName,
        logoUrl,
        details: parsed.value,
        items: cart.items,
      });
    } catch {
      setError("We could not create the PDF. Please try again.");
    } finally {
      setPdfPending(false);
    }
  }

  async function sendOrder() {
    setError("");
    setPriceNotice("");
    setOpened(false);

    const parsed = parseCheckoutDetails({ name, mobile, address, note });

    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }

    if (!meetsMinimumOrder(cart.subtotal)) {
      setError(
        `Minimum order value is ${formatInr(minimumOrderValue)}. Add ${formatInr(minimumOrderShortfall(cart.subtotal))} more to place this order.`,
      );
      return;
    }

    setPending(true);
    const quote = await quoteCart(
      cart.items.map((item) => ({ slug: item.slug, quantity: item.quantity })),
    );
    setPending(false);

    if (!quote.ok) {
      setError(quote.message);
      return;
    }

    const quoted = new Set(quote.items.map((item) => item.slug));
    const missing = cart.items.filter((item) => !quoted.has(item.slug));
    const applied = cart.applyQuotes(quote.items);

    if (missing.length > 0) {
      setBlocked(missing.map((item) => item.slug));
      setError(
        `These products are no longer available: ${missing.map((item) => item.name).join(", ")}. Remove them before sending the order.`,
      );
      return;
    }

    setBlocked([]);

    if (applied.changedNames.length > 0) {
      setPriceNotice(
        applied.changedNames.length === 1
          ? `The selling price of ${applied.changedNames[0]} was updated. Review the total, then send the order.`
          : `Selling prices were updated for ${applied.changedNames.join(", ")}. Review the total, then send the order.`,
      );
      return;
    }

    if (!meetsMinimumOrder(cartSubtotal(applied.items))) {
      setError(
        `Minimum order value is ${formatInr(minimumOrderValue)}. Add ${formatInr(minimumOrderShortfall(cartSubtotal(applied.items)))} more to place this order.`,
      );
      return;
    }

    const url = whatsAppOrderUrl(phones, applied.items, parsed.value);

    if (!url) {
      setError("WhatsApp ordering is not available for this shop.");
      return;
    }
    const popup = window.open(url, "_blank", "noopener,noreferrer");

    if (!popup) {
      window.location.assign(url);
    }

    setOpened(true);
  }

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {cart.items.map((item) => (
            <li key={item.slug} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- cart photos use the stored public image URL
                <img
                  src={item.imageUrl}
                  alt=""
                  className="size-16 shrink-0 rounded-xl object-cover sm:size-20"
                />
              ) : (
                <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-background text-[10px] text-muted sm:size-20">
                  No image
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg leading-tight text-balance text-ink sm:text-xl">
                    {item.name}
                  </h2>
                  <p className="shrink-0 text-sm font-semibold text-ink tabular-nums">
                    {formatInr(item.price * item.quantity)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted">
                  Selling price {formatInr(item.price)}
                </p>
                {blocked.includes(item.slug) ? (
                  <p className="mt-1 text-sm text-accent-deep">Unavailable</p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <QuantitySelector
                    productName={item.name}
                    value={item.quantity}
                    max={maxCartQuantity}
                    onChange={(quantity) => cart.updateQuantity(item.slug, quantity)}
                  />
                  <button
                    type="button"
                    onClick={() => cart.removeItem(item.slug)}
                    className="inline-flex h-11 items-center justify-center rounded-full px-3 text-sm font-medium text-accent-deep hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <span className="sr-only">Remove {item.name}</span>
                    <span aria-hidden="true">Remove</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ButtonLink href="/products" variant="secondary">
            Continue Shopping
          </ButtonLink>
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-ink ring-1 ring-line hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Clear cart
          </button>
        </div>
      </div>
      <section className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-display text-2xl text-ink">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Total items</dt>
            <dd className="font-medium text-ink tabular-nums">{cart.itemCount}</dd>
          </div>
          <div className="flex justify-between gap-4 text-base">
            <dt className="font-medium text-ink">Estimated total</dt>
            <dd className="font-semibold text-ink tabular-nums">
              {formatInr(cart.subtotal)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm leading-6 text-muted">
          This total uses the selling price. WhatsApp opens a draft message. The
          order is sent only after you press Send there.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void sendOrder();
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Customer name
            </span>
            <input
              required
              value={name}
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              className={fieldClassName}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Mobile number
            </span>
            <input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={mobile}
              placeholder="9876543210"
              onChange={(event) => setMobile(event.target.value)}
              className={fieldClassName}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Delivery address
            </span>
            <textarea
              required
              value={address}
              rows={4}
              autoComplete="street-address"
              onChange={(event) => setAddress(event.target.value)}
              className="w-full rounded-2xl border border-line bg-background px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Note <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea
              value={note}
              rows={3}
              onChange={(event) => setNote(event.target.value)}
              className="w-full rounded-2xl border border-line bg-background px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
          </label>
          {priceNotice ? (
            <p role="status" className="text-sm leading-6 text-ink">
              {priceNotice}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm leading-6 text-accent-deep">
              {error}
            </p>
          ) : null}
          {blockedItems.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                blockedItems.forEach((item) => cart.removeItem(item.slug));
                setBlocked([]);
                setError("");
              }}
              className="text-sm font-medium text-ink underline decoration-line underline-offset-4"
            >
              Remove unavailable products
            </button>
          ) : null}
          {opened ? (
            <p role="status" className="text-sm leading-6 text-ink">
              WhatsApp opened with your order details. Please press Send to place
              the order.
            </p>
          ) : null}
          {!meetsMinimum ? (
            <div role="status" className="text-sm leading-6 text-ink">
              <p>Minimum order value is {formatInr(minimumOrderValue)}</p>
              <p>Add {formatInr(shortfall)} more to place this order.</p>
            </div>
          ) : null}
          <div className="space-y-3">
            <button
              type="button"
              disabled={!meetsMinimum || pending || pdfPending}
              onClick={() => void downloadPdf()}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-background px-5 text-sm font-medium text-ink ring-1 ring-line transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
            >
              {pdfPending ? "Preparing PDF…" : "Download Order PDF"}
            </button>
            {whatsappNumber ? (
              <button
                type="submit"
                disabled={!meetsMinimum || pending || pdfPending}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground transition hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
              >
                {pending ? "Checking prices…" : "Send Order on WhatsApp"}
              </button>
            ) : (
              <p className="text-sm leading-6 text-muted">
                WhatsApp ordering is not available for this shop.
              </p>
            )}
            {meetsMinimum ? (
              <p className="text-sm leading-6 text-muted">
                Download the PDF first, then attach it in WhatsApp before sending.
              </p>
            ) : null}
          </div>
        </form>
      </section>
      {confirmClear ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-cart-title"
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lg"
          >
            <h2 id="clear-cart-title" className="font-display text-2xl text-ink">
              Clear this cart?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              This removes every cracker from the cart on this device.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  cart.clear();
                  setConfirmClear(false);
                  setBlocked([]);
                  setError("");
                  setPriceNotice("");
                  setOpened(false);
                }}
                className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Clear cart
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-background px-5 text-sm font-medium text-ink ring-1 ring-line hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
