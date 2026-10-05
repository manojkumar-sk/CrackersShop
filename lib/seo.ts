import type { Metadata } from "next";
import type { PublicShop } from "@/lib/shop";
import { site, siteUrl } from "@/lib/site";
import type { Product } from "@/types/catalog";

export function absoluteUrl(path: string) {
  if (path === "/") {
    return siteUrl;
  }

  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function storefrontMetadata({
  title,
  description,
  path,
  image,
  index = true,
}: {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  index?: boolean;
}): Metadata {
  const fullTitle = `${title} | ${site.name}`;
  const text = description?.trim() || undefined;
  const photo = image?.trim() || undefined;

  return {
    title,
    description: text,
    alternates: { canonical: path },
    robots: { index, follow: index },
    openGraph: {
      title: fullTitle,
      description: text,
      url: path,
      siteName: site.name,
      type: "website",
      images: photo ? [{ url: photo, alt: title }] : undefined,
    },
    twitter: {
      card: photo ? "summary_large_image" : "summary",
      title: fullTitle,
      description: text,
      images: photo ? [photo] : undefined,
    },
  };
}

export function homepageJsonLd(shop: PublicShop | null) {
  const organization: Record<string, unknown> = {
    "@type": shop?.address ? "LocalBusiness" : "Organization",
    name: site.name,
    url: siteUrl,
    description: site.description,
  };

  if (shop?.logoUrl) {
    organization.logo = shop.logoUrl;
  }

  if (shop?.email) {
    organization.email = shop.email;
  }

  if (shop?.address) {
    organization.address = {
      "@type": "PostalAddress",
      streetAddress: shop.address,
    };
  }

  const phone = shop?.phones.find((item) => item.isPrimary) ?? shop?.phones[0];

  if (phone) {
    organization.telephone = `+${phone.phoneNumber}`;
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: site.name,
        url: siteUrl,
        description: site.description,
      },
      organization,
    ],
  };
}

export function productJsonLd(product: Product) {
  const url = absoluteUrl(`/products/${product.id}`);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
    brand: {
      "@type": "Brand",
      name: site.name,
    },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: product.price,
      availability: "https://schema.org/InStock",
    },
  };

  const description = product.description.trim();

  if (description) {
    data.description = description;
  }

  if (product.imageUrl) {
    data.image = product.imageUrl;
  }

  return data;
}
