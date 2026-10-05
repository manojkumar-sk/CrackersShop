import { CategorySection } from "@/components/home/category-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { Offers } from "@/components/home/offers";
import { Trust } from "@/components/home/trust";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { getPublicShop, ShopUnavailableError } from "@/lib/shop";
import { site } from "@/lib/site";

export default async function HomePage() {
  let shopName: string = site.name;
  let logoUrl: string | null = null;

  try {
    const shop = await getPublicShop();

    if (shop) {
      shopName = shop.name;
      logoUrl = shop.logoUrl;
    }
  } catch (error) {
    if (!(error instanceof ShopUnavailableError)) {
      throw error;
    }
  }

  return (
    <>
      <Hero shopName={shopName} logoUrl={logoUrl} />
      <CategorySection />
      <FeaturedProducts />
      <Offers />
      <WhyChooseUs />
      <Trust />
    </>
  );
}
