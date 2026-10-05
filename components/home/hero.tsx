import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { HeroSlider } from "@/components/home/hero-slider";
import { Container } from "@/components/ui/container";
import type { ShopSlide } from "@/lib/slides";

export function Hero({
  slides,
  shopName,
  logoUrl,
}: {
  slides: ShopSlide[];
  shopName: string;
  logoUrl: string | null;
}) {
  if (slides.length > 0) {
    return <HeroSlider slides={slides} />;
  }

  return (
    <section className="relative overflow-hidden bg-ink text-background">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(215,181,106,0.35),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(196,83,29,0.45),transparent_36%)]"
      />
      <Container className="relative grid min-h-[32rem] items-end py-16 sm:min-h-[36rem] sm:py-20 lg:min-h-[40rem] lg:py-24">
        <div className="max-w-3xl">
          <Logo name={shopName} logoUrl={logoUrl} size="hero" tone="inverse" />
          <p className="mt-8 text-xs font-semibold tracking-[0.22em] text-gold uppercase">
            Festival orders
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Crackers for a brighter home celebration.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-background/80 sm:text-lg">
            Sparklers, flower pots, chakras, rockets, and gift boxes from one
            shop counter. Every piece shows the marked price beside what you pay.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gold px-6 text-sm font-semibold text-ink transition hover:bg-[#e6c97a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background sm:w-auto"
            >
              Shop Crackers
            </Link>
            <Link
              href="/#categories"
              className="inline-flex h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold text-background ring-1 ring-background/40 transition hover:bg-background/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto"
            >
              View Categories
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
