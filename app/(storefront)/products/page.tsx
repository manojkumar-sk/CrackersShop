import type { Metadata } from "next";
import { ProductBrowser } from "@/components/catalog/product-browser";
import { CatalogNotice } from "@/components/catalog/catalog-status";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  CatalogUnavailableError,
  featuredProductLimit,
  getActiveCategories,
  getActiveProducts,
} from "@/lib/catalog";
import { storefrontMetadata } from "@/lib/seo";
import { getPublicShop, ShopUnavailableError } from "@/lib/shop";
import type { Category, Product } from "@/types/catalog";

export const metadata: Metadata = storefrontMetadata({
  title: "Crackers Collection",
  description:
    "Browse the KG Kumaran Crackers collection: sparklers, flower pots, chakras, rockets, fancy crackers, sound crackers, gift boxes, and the kids range.",
  path: "/products",
});

export default async function ProductsPage() {
  let categories: Category[] = [];
  let products: Product[] = [];
  let unavailable = false;

  try {
    const shop = await getPublicShop();

    if (!shop) {
      return null;
    }

    [categories, products] = await Promise.all([
      getActiveCategories(shop.id),
      getActiveProducts(shop.id),
    ]);
  } catch (error) {
    if (
      !(error instanceof CatalogUnavailableError) &&
      !(error instanceof ShopUnavailableError)
    ) {
      throw error;
    }

    unavailable = true;
  }

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <SectionHeading
        level="h1"
        eyebrow="Catalogue"
        title="All Crackers"
        description="Search the shelf, filter by category, and sort by price, discount, or name. Photos will replace the colour panels later."
      />
      <div className="mt-8">
        {unavailable ? (
          <CatalogNotice
            title="The shelf is unavailable"
            message="We could not load the catalogue just now. Please try again in a moment."
          />
        ) : products.length === 0 ? (
          <CatalogNotice
            title="No crackers yet"
            message="The shelf is empty right now."
          />
        ) : (
          <ProductBrowser
            products={products}
            categories={categories}
            featuredIds={products
              .slice(0, featuredProductLimit)
              .map((product) => product.id)}
          />
        )}
      </div>
    </Container>
  );
}
