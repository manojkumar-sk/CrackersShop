"use client";

import { useEffect, useId, useRef, useState } from "react";
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

type NoticeFocus = "name" | "mobile" | "address" | "note";

type CheckoutNotice = {
  title: string;
  message: string;
  focus: NoticeFocus | null;
};

function checkoutNotice(message: string): CheckoutNotice {
  if (message.startsWith("Enter the customer name") || message.startsWith("Use a name")) {
    return { title: "Name Required", message, focus: "name" };
  }

  if (message.startsWith("Enter a valid Indian mobile")) {
    return { title: "Invalid Mobile Number", message, focus: "mobile" };
  }

  if (message.toLowerCase().includes("address")) {
    return { title: "Invalid Address", message, focus: "address" };
  }

  if (message.startsWith("Use a note")) {
    return { title: "Note Too Long", message, focus: "note" };
  }

  if (message.startsWith("Minimum order")) {
    return { title: "Minimum Order Amount", message, focus: null };
  }

  return { title: "Check your order", message, focus: null };
}

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
  const [notice, setNotice] = useState<CheckoutNotice | null>(null);
  const noticeTitleId = useId();
  const noticeCloseRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const noticeFocus = useRef<NoticeFocus | null>(null);

  function showNotice(message: string) {
    const next = checkoutNotice(message);
    noticeFocus.current = next.focus;
    setError(message);
    setNotice(next);
  }

  function closeNotice() {
    setNotice(null);
  }

  useEffect(() => {
    if (!notice) {
      const focus = noticeFocus.current;
      noticeFocus.current = null;

      if (focus === "name") {
        nameRef.current?.focus();
      } else if (focus === "mobile") {
        mobileRef.current?.focus();
      } else if (focus === "address") {
        addressRef.current?.focus();
      } else if (focus === "note") {
        noteRef.current?.focus();
      }

      return;
    }

    noticeCloseRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotice(null);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [notice]);

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
      showNotice(
        `Minimum order value is ${formatInr(minimumOrderValue)}. Add ${formatInr(minimumOrderShortfall(cart.subtotal))} more to place this order.`,
      );
      return;
    }

    const parsed = parseCheckoutDetails({ name, mobile, address, note });

    if (!parsed.ok) {
      showNotice(parsed.message);
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
      showNotice("We could not create the PDF. Please try again.");
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
      showNotice(parsed.message);
      return;
    }

    if (!meetsMinimumOrder(cart.subtotal)) {
      showNotice(
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
      showNotice(quote.message);
      return;
    }

    const quoted = new Set(quote.items.map((item) => item.slug));
    const missing = cart.items.filter((item) => !quoted.has(item.slug));
    const applied = cart.applyQuotes(quote.items);

    if (missing.length > 0) {
      setBlocked(missing.map((item) => item.slug));
      showNotice(
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
      showNotice(
        `Minimum order value is ${formatInr(minimumOrderValue)}. Add ${formatInr(minimumOrderShortfall(cartSubtotal(applied.items)))} more to place this order.`,
      );
      return;
    }

    const url = whatsAppOrderUrl(phones, applied.items, parsed.value);

    if (!url) {
      showNotice("WhatsApp ordering is not available for this shop.");
      return;
    }
    const popup = window.open(url, "_blank", "noopener,noreferrer");

    if (!popup) {
      window.location.assign(url);
    }

    setOpened(true);
  }

  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-8">
      <div className="min-w-0">
        <h2 className="font-display text-2xl text-ink">Cart items</h2>
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[1.6rem] border border-line bg-surface">
          {cart.items.map((item) => (
            <li key={item.slug} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- cart photos use the stored public image URL
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="size-20 shrink-0 rounded-2xl object-cover sm:size-24"
                />
              ) : (
                <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-background text-[10px] text-muted sm:size-24">
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
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-ink ring-1 ring-line hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Clear cart
          </button>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
      <section className="rounded-[1.6rem] bg-ink p-5 text-background sm:p-6">
        <h2 className="font-display text-2xl">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-background/70">Items</dt>
            <dd className="font-medium tabular-nums">{cart.items.length}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-background/70">Total quantity</dt>
            <dd className="font-medium tabular-nums">{cart.itemCount}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-white/15 pt-3 text-base">
            <dt className="font-medium">Estimated total</dt>
            <dd className="font-semibold tabular-nums">{formatInr(cart.subtotal)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm leading-6 text-background/70">
          This total uses the selling price. WhatsApp opens a draft message. The
          order is sent only after you press Send there.
        </p>
        <div className="mt-5">
          <ButtonLink href="/products" className="w-full">
            Continue Shopping
          </ButtonLink>
        </div>
      </section>
      <section className="rounded-[1.6rem] border border-line bg-surface p-5 sm:p-6">
        <form
          className="mt-6 space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void sendOrder();
          }}
        >
          <h3 className="font-display text-xl text-ink">Customer details</h3>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Name
            </span>
            <input
              ref={nameRef}
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
              ref={mobileRef}
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
              Address
            </span>
            <textarea
              ref={addressRef}
              value={address}
              rows={4}
              autoComplete="street-address"
              onChange={(event) => setAddress(event.target.value)}
              className="w-full rounded-2xl border border-line bg-background px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Additional note <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea
              ref={noteRef}
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
              disabled={pending || pdfPending}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground transition hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
              >
                {pending ? "Checking prices…" : "Send Order via WhatsApp"}
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
      </div>
      {notice ? (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-[#120818]/80 p-4"
          onClick={closeNotice}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={noticeTitleId}
            className="w-full max-w-md rounded-[1.6rem] border border-gold bg-surface p-6 shadow-[0_24px_60px_-24px_rgba(26,16,36,0.8)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={noticeTitleId} className="font-display text-2xl text-ink">
              {notice.title}
            </h2>
            <p className="mt-3 text-base leading-7 text-ink">{notice.message}</p>
            <button
              ref={noticeCloseRef}
              type="button"
              onClick={closeNotice}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
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
