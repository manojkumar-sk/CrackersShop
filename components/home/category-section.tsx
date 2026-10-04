import { Suspense } from "react";
import { CategoryCard } from "@/components/catalog/category-card";
import {
  CatalogLoading,
  CatalogNotice,
} from "@/components/catalog/catalog-status";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  CatalogUnavailableError,
  getActiveCategories,
} from "@/lib/catalog";
import { getPublicShop, ShopUnavailableError } from "@/lib/shop";
import type { Category } from "@/types/catalog";

export function CategorySection() {
  return (
    <section id="categories" className="scroll-mt-20 py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeading
          eyebrow="Categories"
          title="Shop by category"
          description="Eight ranges for a home celebration, from handheld sparklers to packed gift boxes."
        />
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
      <div className="mt-8 lg:mt-10">
        <CatalogNotice
          title="The shelf is unavailable"
          message="We could not load the categories just now. Please try again in a moment."
        />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="mt-8 lg:mt-10">
        <CatalogNotice
          title="No categories yet"
          message="New ranges will show here once they are added to the shelf."
        />
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-10 lg:grid-cols-4">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}
