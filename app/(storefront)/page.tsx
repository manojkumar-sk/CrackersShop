import { CategorySection } from "@/components/home/category-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { Offers } from "@/components/home/offers";
import { Trust } from "@/components/home/trust";
import { WhyChooseUs } from "@/components/home/why-choose-us";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategorySection />
      <FeaturedProducts />
      <Offers />
      <WhyChooseUs />
      <Trust />
    </>
  );
}
