import type { Metadata } from "next";
import { CategorySection } from "@/components/home/category-section";
import { ContactSection } from "@/components/home/contact-section";
import { Sponsors } from "@/components/home/sponsors";
import { FeaturedProducts } from "@/components/home/featured-products";
import { FestiveSky } from "@/components/home/festive-sky";
import { Hero } from "@/components/home/hero";
import { Offers } from "@/components/home/offers";
import { Trust } from "@/components/home/trust";
import { WhatsAppBand } from "@/components/home/whatsapp-band";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { JsonLd } from "@/components/seo/json-ld";
import { homepageJsonLd } from "@/lib/seo";
import { getPublicShop, ShopUnavailableError, type PublicShop } from "@/lib/shop";
import { primaryWhatsAppNumber } from "@/lib/shop-phones";
import { getActiveSponsors } from "@/lib/sponsors";
import { getActiveSlides, type ShopSlide } from "@/lib/slides";
import type { ShopSponsor } from "@/lib/sponsors";
import { shopWhatsAppUrl, site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: site.title },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: site.title,
    description: site.description,
    url: "/",
    siteName: site.name,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: site.title,
    description: site.description,
  },
};

export default async function HomePage() {
  let shopName: string = site.name;
  let logoUrl: string | null = null;
  let slides: ShopSlide[] = [];
  let sponsors: ShopSponsor[] = [];
  let chatUrl: string | null = null;
  let shop: PublicShop | null = null;

  try {
    shop = await getPublicShop();

    if (shop) {
      shopName = shop.name;
      logoUrl = shop.logoUrl;
      slides = await getActiveSlides(shop.id);
      sponsors = await getActiveSponsors(shop.id);
      chatUrl = shopWhatsAppUrl(primaryWhatsAppNumber(shop.phones));
    }
  } catch (error) {
    if (!(error instanceof ShopUnavailableError)) {
      throw error;
    }
  }

  return (
    <div className="festive-sky relative isolate">
      <JsonLd data={homepageJsonLd(shop)} />
      <FestiveSky />
      <div className="relative">
        <Hero slides={slides} shopName={shopName} logoUrl={logoUrl} />
        <Sponsors sponsors={sponsors} />
        <CategorySection />
        <FeaturedProducts />
        <Offers />
        <WhyChooseUs />
        <Trust />
        <WhatsAppBand chatUrl={chatUrl} />
        {shop ? <ContactSection shop={shop} /> : null}
      </div>
    </div>
  );
}
