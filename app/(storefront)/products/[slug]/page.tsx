import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/catalog/product-detail";
import { CatalogNotice } from "@/components/catalog/catalog-status";
import { Container } from "@/components/ui/container";
import {
  CatalogUnavailableError,
  getActiveCategories,
  getProductBySlug,
} from "@/lib/catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { productJsonLd, storefrontMetadata } from "@/lib/seo";
import { getPublicShop, ShopUnavailableError } from "@/lib/shop";
import type { Product } from "@/types/catalog";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const shop = await getPublicShop();

    if (!shop) {
      return { title: "Shop not found" };
    }

    const product = await getProductBySlug(shop.id, slug);

    if (!product) {
      return { title: "Product not found" };
    }

    return storefrontMetadata({
      title: product.name,
      description: product.description,
      path: `/products/${product.id}`,
      image: product.imageUrl,
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

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product: Product | null = null;
  let unavailable = false;

  let shopId = "";

  try {
    const shop = await getPublicShop();

    if (!shop) {
      return null;
    }

    shopId = shop.id;
    product = await getProductBySlug(shop.id, slug);
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
          message="We could not load this cracker just now. Please try again in a moment."
        />
      </Container>
    );
  }

  if (!product) {
    notFound();
  }

  let category: Awaited<ReturnType<typeof getActiveCategories>>[number] | undefined;

  try {
    const categories = await getActiveCategories(shopId);
    category = categories.find((item) => item.name === product.categoryName);
  } catch (error) {
    if (!(error instanceof CatalogUnavailableError)) {
      throw error;
    }
  }

  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <JsonLd data={productJsonLd(product)} />
      <ProductDetail product={product} category={category} />
    </Container>
  );
}
