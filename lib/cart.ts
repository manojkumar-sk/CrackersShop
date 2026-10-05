export const cartStorageKey = "cracker-store-cart";

export const maxCartQuantity = 999;

export const minimumOrderValue = 2500;

export function minimumOrderShortfall(total: number) {
  return Math.max(0, minimumOrderValue - total);
}

export function meetsMinimumOrder(total: number) {
  return total >= minimumOrderValue;
}

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

export type CartDraft = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
  quantity?: number;
};

const emptyCart: CartItem[] = [];

let memory: CartItem[] = emptyCart;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeCart(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCartSnapshot() {
  if (!loaded) {
    memory = readCart();
    loaded = true;
  }

  return memory;
}

export function getServerCartSnapshot() {
  return emptyCart;
}

function commit(next: CartItem[]) {
  memory = next;
  loaded = true;

  try {
    localStorage.setItem(cartStorageKey, JSON.stringify(next));
  } catch {
    // The cart still updates in memory if storage is blocked.
  }

  emit();
}

function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return emptyCart;
  }

  try {
    const raw = localStorage.getItem(cartStorageKey);

    if (!raw) {
      return emptyCart;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return emptyCart;
    }

    const items = mergeItems(parsed.flatMap(normalizeItem));
    return items.length > 0 ? items : emptyCart;
  } catch {
    return emptyCart;
  }
}

function normalizeItem(value: unknown): CartItem[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const row = value as Record<string, unknown>;
  const id = text(row.id);
  const slug = text(row.slug);
  const name = text(row.name);
  const price = whole(row.price);
  const quantity = whole(row.quantity);
  const imageUrl = text(row.imageUrl);

  if (!id || !slug || !name || price === null || price <= 0 || quantity === null) {
    return [];
  }

  return [
    {
      id,
      slug,
      name,
      price,
      quantity: clampQuantity(quantity),
      ...(imageUrl ? { imageUrl } : {}),
    },
  ];
}

function mergeItems(items: CartItem[]) {
  const merged = new Map<string, CartItem>();

  for (const item of items) {
    const existing = merged.get(item.slug);

    if (!existing) {
      merged.set(item.slug, item);
      continue;
    }

    merged.set(item.slug, {
      ...existing,
      name: item.name,
      price: item.price,
      quantity: clampQuantity(existing.quantity + item.quantity),
      ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
    });
  }

  return [...merged.values()];
}

function text(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function whole(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) ? number : null;
}

export function clampQuantity(quantity: number) {
  return Math.min(maxCartQuantity, Math.max(1, Math.trunc(quantity)));
}

export function addCartItem(draft: CartDraft) {
  const quantity = clampQuantity(draft.quantity ?? 1);
  const current = getCartSnapshot();
  const existing = current.find((item) => item.slug === draft.slug);
  const nextQuantity = existing
    ? clampQuantity(existing.quantity + quantity)
    : quantity;

  const nextItem: CartItem = {
    id: draft.id,
    name: draft.name,
    slug: draft.slug,
    price: draft.price,
    quantity: nextQuantity,
    ...(draft.imageUrl ? { imageUrl: draft.imageUrl } : {}),
  };

  const next = existing
    ? current.map((item) => (item.slug === draft.slug ? nextItem : item))
    : [...current, nextItem];

  commit(next);

  return {
    quantity: nextQuantity,
    capped: existing ? existing.quantity + quantity > maxCartQuantity : quantity > maxCartQuantity,
  };
}

export function updateCartQuantity(slug: string, quantity: number) {
  const nextQuantity = clampQuantity(quantity);
  const current = getCartSnapshot();
  commit(
    current.map((item) =>
      item.slug === slug ? { ...item, quantity: nextQuantity } : item,
    ),
  );
}

export function removeCartItem(slug: string) {
  commit(getCartSnapshot().filter((item) => item.slug !== slug));
}

export function clearCart() {
  commit(emptyCart);
}

export function applyCartQuotes(
  quotes: { slug: string; name: string; price: number; imageUrl?: string }[],
) {
  const current = getCartSnapshot();
  const quoted = new Map(quotes.map((quote) => [quote.slug, quote]));
  const priceChanges: string[] = [];

  const next = current.map((item) => {
    const quote = quoted.get(item.slug);

    if (!quote) {
      return item;
    }

    if (quote.price !== item.price) {
      priceChanges.push(item.name);
    }

    return {
      ...item,
      name: quote.name,
      price: quote.price,
      ...(quote.imageUrl ? { imageUrl: quote.imageUrl } : {}),
    };
  });

  commit(next);
  return { items: next, changedNames: priceChanges };
}

export function cartItemCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}
