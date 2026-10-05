"use client";

import { useEffect, useState } from "react";
import type { HeroBanner } from "@/lib/hero-banners";

const advanceMs = 5000;

export function HeroSlider({ banners }: { banners: HeroBanner[] }) {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = banners.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion || count < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, advanceMs);

    return () => window.clearInterval(timer);
  }, [count, index, reducedMotion]);

  if (count === 0) {
    return null;
  }

  const active = banners[index] ?? banners[0];

  function show(next: number) {
    setIndex((next + count) % count);
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl bg-ink text-background shadow-sm">
      <div className="relative aspect-[4/3] sm:aspect-[5/4] lg:min-h-[28rem]">
        {banners.map((banner, bannerIndex) => (
          // eslint-disable-next-line @next/next/no-img-element -- banner files are served from this app
          <img
            key={banner.id}
            src={banner.imageUrl}
            alt={bannerIndex === index ? banner.alt : ""}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${
              bannerIndex === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-5 sm:p-7">
          <p className="font-display text-2xl leading-tight tracking-tight text-balance sm:text-3xl">
            {active.title}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-background/80">{active.caption}</p>
        </div>
      </div>
      {count > 1 ? (
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <button
            type="button"
            aria-label="Previous banner"
            onClick={() => show(index - 1)}
            className="inline-flex size-11 items-center justify-center rounded-full bg-background/90 text-lg text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next banner"
            onClick={() => show(index + 1)}
            className="inline-flex size-11 items-center justify-center rounded-full bg-background/90 text-lg text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            ›
          </button>
        </div>
      ) : null}
      </div>
      {count > 1 ? (
        <div className="mt-3 flex justify-center gap-2" role="group" aria-label="Banner slides">
          {banners.map((banner, bannerIndex) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Show ${banner.title}`}
              aria-current={bannerIndex === index ? "true" : undefined}
              onClick={() => show(bannerIndex)}
              className={`size-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                bannerIndex === index ? "bg-accent-strong" : "bg-line"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
