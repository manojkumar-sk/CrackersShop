import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Container } from "@/components/ui/container";
import { storefrontMetadata } from "@/lib/seo";
import { getPublicShop, ShopUnavailableError } from "@/lib/shop";

export const metadata: Metadata = storefrontMetadata({
  title: "Cart",
  description: "Review your crackers and send the order on WhatsApp.",
  path: "/cart",
  index: false,
});

export default async function CartPage() {
  let phones: { phoneNumber: string; isWhatsapp: boolean; isPrimary: boolean }[] = [];
  let shopName = "";
  let logoUrl: string | null = null;

  try {
    const shop = await getPublicShop();

    if (!shop) {
      return null;
    }

    phones = shop.phones;
    shopName = shop.name;
    logoUrl = shop.logoUrl;
  } catch (error) {
    if (!(error instanceof ShopUnavailableError)) {
      throw error;
    }

    return null;
  }

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Checkout
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Your cart
      </h1>
      <CartView phones={phones} shopName={shopName} logoUrl={logoUrl} />
    </Container>
  );
}
