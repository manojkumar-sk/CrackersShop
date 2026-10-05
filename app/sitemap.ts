import type { MetadataRoute } from "next";
import { CatalogUnavailableError, getCatalogueSitemap } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/seo";
import { getPublicShop, ShopUnavailableError } from "@/lib/shop";
import { siteUrl } from "@/lib/site";

function lastModified(value: string | null) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/products"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  try {
    const shop = await getPublicShop();

    if (!shop) {
      return entries;
    }

    const catalogue = await getCatalogueSitemap(shop.id);

    for (const category of catalogue.categories) {
      entries.push({
        url: absoluteUrl(`/categories/${category.slug}`),
        lastModified: lastModified(category.updatedAt),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const product of catalogue.products) {
      entries.push({
        url: absoluteUrl(`/products/${product.slug}`),
        lastModified: lastModified(product.updatedAt),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (error) {
    if (
      !(error instanceof CatalogUnavailableError) &&
      !(error instanceof ShopUnavailableError)
    ) {
      throw error;
    }
  }

  return entries;
}
