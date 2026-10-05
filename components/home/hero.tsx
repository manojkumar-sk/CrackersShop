import Link from "next/link";
import { HeroSlider } from "@/components/home/hero-slider";
import type { ShopSlide } from "@/lib/slides";

export function Hero({
  slides,
  shopName,
}: {
  slides: ShopSlide[];
  shopName: string;
  logoUrl: string | null;
}) {
  if (slides.length > 0) {
    return <HeroSlider slides={slides} />;
  }

  return (
    <section aria-label={shopName} className="relative px-4 pt-4 pb-2 sm:px-6 sm:pt-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        aria-hidden="true"
      >
        <span className="absolute top-6 left-[8%] size-2 rounded-full bg-[#ffe08a] shadow-[0_0_12px_4px_rgba(255,210,90,0.85)]" />
        <span className="absolute top-10 right-[10%] size-1.5 rounded-full bg-[#ffd0ea] shadow-[0_0_10px_3px_rgba(255,120,170,0.8)]" />
      </div>
      <div className="relative mx-auto flex h-[240px] max-w-6xl flex-col justify-end overflow-hidden rounded-3xl bg-ink px-4 pt-4 pb-5 text-background shadow-[0_22px_50px_-28px_rgba(36,12,48,0.75)] sm:h-[280px] sm:px-8 md:h-[360px] lg:h-[420px] lg:px-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,186,64,0.45),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,70,120,0.35),transparent_36%)]"
        />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#ffe08a] uppercase">
            Festival orders
          </p>
          <h1 className="mt-2 font-display text-[1.65rem] leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Crackers for a brighter home celebration.
          </h1>
          <p className="mt-2 hidden max-w-xl text-sm leading-6 text-background/85 sm:block sm:text-base">
            Sparklers, flower pots, chakras, rockets, and gift boxes from one
            shop counter.
          </p>
          <div className="mt-3 flex max-w-md flex-col gap-2 sm:mt-4 sm:max-w-none sm:flex-row">
            <Link
              href="/products"
              className="inline-flex h-10 w-full items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-ink transition hover:bg-[#e6c97a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background sm:w-auto"
            >
              Shop Crackers
            </Link>
            <Link
              href="/#categories"
              className="inline-flex h-10 w-full items-center justify-center rounded-full px-5 text-sm font-semibold text-background ring-1 ring-background/40 transition hover:bg-background/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto"
            >
              View Categories
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
