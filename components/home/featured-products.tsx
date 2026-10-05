import { Suspense } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import {
  CatalogLoading,
  CatalogNotice,
} from "@/components/catalog/catalog-status";
import { Container } from "@/components/ui/container";
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
      className="scroll-mt-20 bg-[radial-gradient(circle_at_top,rgba(255,214,120,0.38),transparent_46%),linear-gradient(#fff8ef,#fffaf3)] py-14 sm:py-16 lg:py-20"
    >
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase">
              Featured
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight text-balance text-ink sm:text-5xl">
              Pieces people start with
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted">
            Selling prices sit beside the marked price. Add a piece straight
            from the card.
          </p>
        </div>
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
      <div className="mt-10">
        <CatalogNotice
          title="The shelf is unavailable"
          message="We could not load the featured crackers just now. Please try again in a moment."
        />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mt-10">
        <CatalogNotice
          title="No featured crackers yet"
          message="Featured pieces will show here once the shelf has products."
        />
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
