import type { Metadata } from "next";
import { AdminNotice } from "@/components/admin/admin-notice";
import { PriceList } from "@/components/admin/price-list";
import { Container } from "@/components/ui/container";
import {
  AdminUnavailableError,
  getAdminCategories,
  getAdminProducts,
  type AdminCategory,
  type AdminProduct,
} from "@/lib/admin";
import { getCurrentShop } from "@/lib/shop";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Price list",
  robots: { index: false, follow: false },
};

export default async function PriceListPage() {
  let products: AdminProduct[] = [];
  let categories: AdminCategory[] = [];
  let unavailable = false;
  const current = await getCurrentShop();
  const shopName = current.status === "ok" ? current.shop.name : site.name;

  try {
    [products, categories] = await Promise.all([
      getAdminProducts(),
      getAdminCategories(),
    ]);
  } catch (error) {
    if (!(error instanceof AdminUnavailableError)) {
      throw error;
    }

    unavailable = true;
  }

  if (unavailable) {
    return (
      <Container className="py-10 sm:py-14">
        <AdminNotice
          title="The price list is unavailable"
          message="We could not load product prices just now. Please try again in a moment."
        />
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase print:hidden">
          Catalogue
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl print:hidden">
          Price list
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted print:hidden">
          Update MRP and selling price for {shopName}. Discount is calculated from those two prices.
        </p>
      </div>
      <PriceList shopName={shopName} products={products} categories={categories} />
    </Container>
  );
}
