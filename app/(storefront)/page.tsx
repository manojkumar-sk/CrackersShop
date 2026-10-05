import { CategorySection } from "@/components/home/category-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { FestiveSky } from "@/components/home/festive-sky";
import { Hero } from "@/components/home/hero";
import { Offers } from "@/components/home/offers";
import { Trust } from "@/components/home/trust";
import { WhatsAppBand } from "@/components/home/whatsapp-band";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { getPublicShop, ShopUnavailableError } from "@/lib/shop";
import { primaryWhatsAppNumber } from "@/lib/shop-phones";
import { getActiveSlides, type ShopSlide } from "@/lib/slides";
import { shopWhatsAppUrl, site } from "@/lib/site";

export default async function HomePage() {
  let shopName: string = site.name;
  let logoUrl: string | null = null;
  let slides: ShopSlide[] = [];
  let chatUrl: string | null = null;

  try {
    const shop = await getPublicShop();

    if (shop) {
      shopName = shop.name;
      logoUrl = shop.logoUrl;
      slides = await getActiveSlides(shop.id);
      chatUrl = shopWhatsAppUrl(primaryWhatsAppNumber(shop.phones));
    }
  } catch (error) {
    if (!(error instanceof ShopUnavailableError)) {
      throw error;
    }
  }

  return (
    <div className="festive-sky relative isolate">
      <FestiveSky />
      <div className="relative">
        <Hero slides={slides} shopName={shopName} logoUrl={logoUrl} />
        <CategorySection />
        <FeaturedProducts />
        <Offers />
        <WhyChooseUs />
        <Trust />
        <WhatsAppBand chatUrl={chatUrl} />
      </div>
    </div>
  );
}
