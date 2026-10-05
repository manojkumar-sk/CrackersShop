import { Suspense } from "react";
import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ShopNotFound, ShopUnavailable } from "@/components/shop/shop-status";
import { getPublicShop, ShopUnavailableError, type PublicShop } from "@/lib/shop";
import { site } from "@/lib/site";

async function resolveShop(): Promise<
  | { status: "ok"; shop: PublicShop }
  | { status: "missing" }
  | { status: "unavailable" }
> {
  try {
    const shop = await getPublicShop();
    return shop ? { status: "ok", shop } : { status: "missing" };
  } catch (error) {
    if (!(error instanceof ShopUnavailableError)) {
      throw error;
    }

    return { status: "unavailable" };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const resolved = await resolveShop();

  if (resolved.status === "missing") {
    return { title: { absolute: "Shop not found" } };
  }

  if (resolved.status === "unavailable") {
    return { title: { absolute: "Shop unavailable" } };
  }

  return {
    title: {
      default: site.title,
      template: `%s | ${site.name}`,
    },
    description: site.description,
    robots: { index: true, follow: true },
  };
}

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const resolved = await resolveShop();

  if (resolved.status === "unavailable") {
    return <ShopUnavailable />;
  }

  if (resolved.status === "missing") {
    return <ShopNotFound />;
  }

  const shop = resolved.shop;

  return (
    <CartProvider>
      <div className="flex min-h-full flex-1 flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
        >
          Skip to content
        </a>
        <Navbar shopName={shop.name} logoUrl={shop.logoUrl} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Suspense fallback={null}>
          <Footer shop={shop} />
        </Suspense>
      </div>
    </CartProvider>
  );
}
