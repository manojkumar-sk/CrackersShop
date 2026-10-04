"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import {
  addCartItem,
  applyCartQuotes,
  cartItemCount,
  cartSubtotal,
  clearCart,
  getCartSnapshot,
  getServerCartSnapshot,
  removeCartItem,
  subscribeCart,
  updateCartQuantity,
  type CartDraft,
  type CartItem,
} from "@/lib/cart";

type CartApi = {
  ready: boolean;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (draft: CartDraft) => { quantity: number; capped: boolean };
  updateQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
  applyQuotes: (
    quotes: { slug: string; name: string; price: number; imageUrl?: string }[],
  ) => { items: CartItem[]; changedNames: string[] };
};

const CartContext = createContext<CartApi | null>(null);

function subscribeReady() {
  return () => {};
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);
  const api: CartApi = {
    ready,
    items,
    itemCount: cartItemCount(items),
    subtotal: cartSubtotal(items),
    addItem: addCartItem,
    updateQuantity: updateCartQuantity,
    removeItem: removeCartItem,
    clear: clearCart,
    applyQuotes: applyCartQuotes,
  };

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);

  if (!cart) {
    throw new Error("useCart must be used within CartProvider");
  }

  return cart;
}
