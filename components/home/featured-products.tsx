import { Suspense } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import {
  CatalogLoading,
  CatalogNotice,
} from "@/components/catalog/catalog-status";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  CatalogUnavailableError,
  getFeaturedProducts,
} from "@/lib/catalog";
import { getPublicShop, ShopUnavailableError } from "@/lib/shop";
import type { Product } from "@/types/catalog";

export function FeaturedProducts() {
  return (
    <section
      id="products"
      className="scroll-mt-20 border-t border-line bg-surface/60 py-12 sm:py-16 lg:py-20"
    >
      <Container>
        <SectionHeading
          eyebrow="Featured"
          title="Pieces people start with"
          description="Selling prices sit beside the marked price. Colour panels stand in until product photos are added."
        />
        <Suspense fallback={<CatalogLoading label="Loading featured crackers" />}>
          <FeaturedGrid />
        </Suspense>
      </Container>
    </section>
  );
}

async function FeaturedGrid() {
  let products: Product[] = [];
  let unavailable = false;

  try {
    const shop = await getPublicShop();

    if (!shop) {
      return null;
    }

    products = await getFeaturedProducts(shop.id);
  } catch (error) {
    if (
      !(error instanceof CatalogUnavailableError) &&
      !(error instanceof ShopUnavailableError)
    ) {
      throw error;
    }

    unavailable = true;
  }

  if (unavailable) {
    return (
      <div className="mt-8 lg:mt-10">
        <CatalogNotice
          title="The shelf is unavailable"
          message="We could not load the featured crackers just now. Please try again in a moment."
        />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mt-8 lg:mt-10">
        <CatalogNotice
          title="No featured crackers yet"
          message="Featured pieces will show here once the shelf has products."
        />
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-10 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
