import { Suspense } from "react";
import { CategoryCard } from "@/components/catalog/category-card";
import {
  CatalogLoading,
  CatalogNotice,
} from "@/components/catalog/catalog-status";
import { Container } from "@/components/ui/container";
import {
  CatalogUnavailableError,
  getActiveCategories,
} from "@/lib/catalog";
import { getPublicShop, ShopUnavailableError } from "@/lib/shop";
import type { Category } from "@/types/catalog";

export function CategorySection() {
  return (
    <section id="categories" className="scroll-mt-20 bg-ink py-14 text-background sm:py-16 lg:py-20">
      <Container>
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
            Shop by category
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
            Eight ranges, one counter.
          </h2>
          <p className="mt-3 text-base leading-7 text-background/75">
            From handheld sparklers to packed gift boxes. Open a range and pick
            the pieces by name.
          </p>
        </div>
        <Suspense fallback={<CatalogLoading label="Loading categories" />}>
          <CategoryGrid />
        </Suspense>
      </Container>
    </section>
  );
}

async function CategoryGrid() {
  let categories: Category[] = [];
  let unavailable = false;

  try {
    const shop = await getPublicShop();

    if (!shop) {
      return null;
    }

    categories = await getActiveCategories(shop.id);
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
          message="We could not load the categories just now. Please try again in a moment."
        />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="mt-10">
        <CatalogNotice
          title="No categories yet"
          message="New ranges will show here once they are added to the shelf."
        />
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}
