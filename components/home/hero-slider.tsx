"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ShopSlide } from "@/lib/slides";

const advanceMs = 5500;

export function HeroSlider({ slides }: { slides: ShopSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = slides.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion || paused || count < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, advanceMs);

    return () => window.clearInterval(timer);
  }, [count, index, paused, reducedMotion]);

  if (count === 0) {
    return null;
  }

  const active = slides[Math.min(index, count - 1)] ?? slides[0];

  function show(next: number) {
    setIndex((next + count) % count);
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promotions"
      className="relative isolate min-h-[32rem] overflow-hidden bg-ink text-background sm:min-h-[36rem] lg:min-h-[40rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      {slides.map((slide) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
            slide.id === active.id ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={slide.id === active.id ? undefined : true}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- banner files are served from storage */}
          <img
            src={slide.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_30%] sm:object-center"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/20 sm:via-ink/45" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink/80 to-transparent sm:h-48" />
      <div className="relative mx-auto flex min-h-[32rem] w-full max-w-6xl flex-col justify-end px-4 pt-28 pb-24 sm:min-h-[36rem] sm:px-6 sm:pb-28 lg:min-h-[40rem] lg:px-8 lg:pb-32">
        <p className="text-xs font-semibold tracking-[0.22em] text-gold uppercase">
          This season
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
          {active.heading}
        </h1>
        {active.description ? (
          <p className="mt-4 max-w-xl text-base leading-7 text-background/85 sm:text-lg">
            {active.description}
          </p>
        ) : null}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <SlideLink href={active.primaryHref}>{active.primaryLabel}</SlideLink>
          {active.secondaryLabel && active.secondaryHref ? (
            <SlideLink href={active.secondaryHref} secondary>
              {active.secondaryLabel}
            </SlideLink>
          ) : null}
        </div>
      </div>
      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => show(index - 1)}
            className="absolute top-1/2 left-3 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-xl text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:left-6"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => show(index + 1)}
            className="absolute top-1/2 right-3 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-xl text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:right-6"
          >
            ›
          </button>
          <div
            className="absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2"
            role="group"
            aria-label="Slides"
          >
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Show ${slide.heading}`}
                aria-current={slide.id === active.id ? "true" : undefined}
                onClick={() => show(slideIndex)}
                className={`h-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                  slide.id === active.id ? "w-8 bg-gold" : "w-2.5 bg-background/70"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function SlideLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: string;
  secondary?: boolean;
}) {
  const className = secondary
    ? "inline-flex h-12 w-full items-center justify-center rounded-full bg-background/10 px-6 text-sm font-semibold text-background ring-1 ring-background/40 transition hover:bg-background/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto"
    : "inline-flex h-12 w-full items-center justify-center rounded-full bg-gold px-6 text-sm font-semibold text-ink transition hover:bg-[#e6c97a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background sm:w-auto";

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
