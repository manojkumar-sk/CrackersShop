import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/product-card";
import { toneClassName } from "@/components/catalog/tone";
import { CatalogNotice } from "@/components/catalog/catalog-status";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  CatalogUnavailableError,
  getCategoryBySlug,
  getProductsByCategory,
} from "@/lib/catalog";
import { getPublicShop, ShopUnavailableError } from "@/lib/shop";
import type { Category, Product } from "@/types/catalog";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const shop = await getPublicShop();

    if (!shop) {
      return { title: "Shop not found" };
    }

    const category = await getCategoryBySlug(shop.id, slug);

    if (!category) {
      return { title: "Category not found" };
    }

    return {
      title: category.name,
      description: category.summary,
    };
  } catch (error) {
    if (
      !(error instanceof CatalogUnavailableError) &&
      !(error instanceof ShopUnavailableError)
    ) {
      throw error;
    }

    return { title: "Catalogue unavailable" };
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  let category: Category | null = null;
  let categoryProducts: Product[] = [];
  let unavailable = false;

  try {
    const shop = await getPublicShop();

    if (!shop) {
      return null;
    }

    category = await getCategoryBySlug(shop.id, slug);

    if (category) {
      categoryProducts = await getProductsByCategory(shop.id, slug);
    }
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
      <Container className="py-10 sm:py-14 lg:py-16">
        <CatalogNotice
          title="The shelf is unavailable"
          message="We could not load this category just now. Please try again in a moment."
        />
      </Container>
    );
  }

  if (!category) {
    notFound();
  }

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link
              href="/"
              className="rounded-sm hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/products"
              className="rounded-sm hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              All crackers
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink" aria-current="page">
            {category.name}
          </li>
        </ol>
      </nav>
      {category.imageUrl ? (
        <div
          className={`relative mb-6 h-36 overflow-hidden rounded-2xl sm:h-48 lg:h-56 ${toneClassName[category.tone]}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- public category photos are served directly from storage */}
          <img
            src={category.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ) : null}
      <SectionHeading
        level="h1"
        eyebrow="Category"
        title={category.name}
        description={category.summary}
      />
      <div className="mt-6">
        <ButtonLink href="/products" variant="secondary">
          Back to all crackers
        </ButtonLink>
      </div>
      {categoryProducts.length === 0 ? (
        <p className="mt-8 text-sm leading-6 text-muted">
          Nothing from this range is on the shelf yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}
