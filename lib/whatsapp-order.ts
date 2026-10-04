import type { CartItem } from "@/lib/cart";
import { cartItemCount, cartSubtotal } from "@/lib/cart";
import type { CheckoutDetails } from "@/lib/checkout";
import { formatInr } from "@/lib/money";
import { primaryWhatsAppNumber, type ShopPhone } from "@/lib/shop-phones";
import { shopWhatsAppUrl } from "@/lib/site";

export function orderMessage(items: CartItem[], details: CheckoutDetails) {
  const lines = items.map(
    (item, index) =>
      `${index + 1}. ${item.name} × ${item.quantity} — ${formatInr(item.price * item.quantity)}`,
  );
  const note = details.note ? `\nNote: ${details.note}` : "";

  return [
    "🔥 Crackers Order",
    "",
    "Customer Details",
    `Name: ${details.name}`,
    `Mobile: ${details.mobile}`,
    `Address: ${details.address}${note}`,
    "",
    "Products",
    ...lines,
    "",
    `Total Items: ${cartItemCount(items)}`,
    `Estimated Total: ${formatInr(cartSubtotal(items))}`,
    "",
    "Please confirm my order.",
  ].join("\n");
}

export function whatsAppOrderUrl(
  phones: readonly ShopPhone[],
  items: CartItem[],
  details: CheckoutDetails,
) {
  const base = shopWhatsAppUrl(primaryWhatsAppNumber(phones));

  if (!base) {
    return null;
  }

  const text = encodeURIComponent(orderMessage(items, details));
  return `${base}?text=${text}`;
}
