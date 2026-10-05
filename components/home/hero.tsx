import { Logo } from "@/components/brand/logo";
import { HeroSlider } from "@/components/home/hero-slider";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { getHeroBanners } from "@/lib/hero-banners";

export function Hero({
  shopName,
  logoUrl,
}: {
  shopName: string;
  logoUrl: string | null;
}) {
  const banners = getHeroBanners();

  return (
    <section className="border-b border-line bg-gradient-to-br from-surface via-background to-[#f6e2c4]">
      <Container className="grid items-center gap-8 py-10 sm:gap-10 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
        <div className="min-w-0">
          <Logo name={shopName} logoUrl={logoUrl} size="hero" />
          <p className="mt-6 text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
            Festival orders
          </p>
          <h1 className="mt-3 max-w-xl font-display text-[1.875rem] leading-[1.12] tracking-tight text-balance text-ink sm:text-5xl lg:text-6xl">
            Crackers for a brighter home celebration.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted sm:mt-5 sm:text-lg">
            Sparklers, flower pots, chakras, rockets, and gift boxes from one
            shop counter. Every piece shows the marked price beside what you pay.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/products" className="w-full sm:w-auto">
              Shop Crackers
            </ButtonLink>
            <ButtonLink
              href="/#categories"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              View Categories
            </ButtonLink>
          </div>
        </div>
        <HeroSlider banners={banners} />
      </Container>
    </section>
  );
}
