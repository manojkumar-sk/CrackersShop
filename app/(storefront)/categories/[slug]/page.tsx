import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBrowser } from "@/components/catalog/product-browser";
import { toneClassName } from "@/components/catalog/tone";
import { ImagePreview } from "@/components/ui/image-preview";
import { CatalogNotice } from "@/components/catalog/catalog-status";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  CatalogUnavailableError,
  featuredProductLimit,
  getActiveCategories,
  getActiveProducts,
  getCategoryBySlug,
} from "@/lib/catalog";
import { storefrontMetadata } from "@/lib/seo";
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

    return storefrontMetadata({
      title: `${category.name} Crackers`,
      description: category.summary,
      path: `/categories/${category.id}`,
      image: category.imageUrl,
    });
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
  let categories: Category[] = [];
  let products: Product[] = [];
  let unavailable = false;

  try {
    const shop = await getPublicShop();

    if (!shop) {
      return null;
    }

    [category, categories, products] = await Promise.all([
      getCategoryBySlug(shop.id, slug),
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
          <ImagePreview src={category.imageUrl} alt={category.name} className="absolute inset-0 h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- public category photos are served directly from storage */}
            <img src={category.imageUrl} alt="" className="h-full w-full object-cover" />
          </ImagePreview>
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
      <div className="mt-8">
        <ProductBrowser
          products={products}
          categories={categories}
          initialCategoryId={category.id}
          syncUrl={false}
          featuredIds={products.slice(0, featuredProductLimit).map((product) => product.id)}
        />
      </div>
    </Container>
  );
}
