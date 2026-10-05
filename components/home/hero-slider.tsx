"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { ImagePreview } from "@/components/ui/image-preview";
import type { ShopSlide } from "@/lib/slides";

const advanceMs = 4500;

const frameClassName =
  "relative h-[240px] overflow-hidden rounded-3xl bg-ink text-background shadow-[0_22px_50px_-28px_rgba(36,12,48,0.75)] sm:h-[280px] md:h-[360px] lg:h-[420px]";

export function HeroSlider({ slides }: { slides: ShopSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
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
    if (reducedMotion || paused || hidden || count < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, advanceMs);

    return () => window.clearInterval(timer);
  }, [count, hidden, index, paused, reducedMotion]);

  useEffect(() => {
    const update = () => setHidden(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  if (count === 0) {
    return null;
  }

  const active = slides[Math.min(index, count - 1)] ?? slides[0];

  function show(next: number) {
    setIndex((next + count) % count);
  }

  return (
    <section aria-label="Promotions" className="relative px-4 pt-28 pb-3 sm:px-6 sm:pt-36 lg:px-8">
      <h1 className="pointer-events-none absolute inset-x-4 top-6 z-10 text-center font-display text-2xl tracking-tight text-[#ffe08a] sm:inset-x-6 sm:top-10 sm:text-3xl lg:inset-x-8">
        {site.name}
      </h1>
      <BannerDecor />
      <div
        aria-roledescription="carousel"
        className={`mx-auto max-w-6xl ${frameClassName}`}
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
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/45 to-ink/10" />
        <ImagePreview
          src={active.imageUrl}
          alt={active.heading}
          className="absolute top-3 left-3 z-10 inline-flex h-9 items-center rounded-full bg-background/90 px-3 text-xs font-semibold text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          View image
        </ImagePreview>
        <div className="relative flex h-full flex-col justify-end px-4 pt-4 pb-12 sm:px-8 sm:pb-14 lg:px-10">
          <h2 className="max-w-2xl font-display text-[1.65rem] leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
            {active.heading}
          </h2>
          {active.description ? (
            <p className="mt-2 hidden max-w-xl text-sm leading-6 text-background/85 sm:line-clamp-2 sm:block sm:text-base">
              {active.description}
            </p>
          ) : null}
          <div className="mt-3 flex max-w-md flex-col gap-2 sm:mt-4 sm:max-w-none sm:flex-row">
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
              className="absolute top-1/2 left-3 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-lg text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:left-4 sm:size-10"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => show(index + 1)}
              className="absolute top-1/2 right-3 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-lg text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:right-4 sm:size-10"
            >
              ›
            </button>
            <div
              className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2"
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
                  className={`h-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                    slide.id === active.id
                      ? "w-7 bg-gold"
                      : "w-2 bg-background/70 ring-1 ring-gold/50"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function BannerDecor() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-visible" aria-hidden="true">
      <span className="absolute top-6 left-[8%] size-2 rounded-full bg-[#ffe08a] shadow-[0_0_12px_4px_rgba(255,210,90,0.85)]" />
      <span className="absolute top-10 right-[10%] size-1.5 rounded-full bg-[#ffd0ea] shadow-[0_0_10px_3px_rgba(255,120,170,0.8)]" />
      <span className="absolute top-3 left-1/2 size-16 -translate-x-1/2 rounded-full bg-[#ffb347]/30 blur-2xl" />
    </div>
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
    ? "inline-flex h-10 w-full items-center justify-center rounded-full bg-background/10 px-5 text-sm font-semibold text-background ring-1 ring-background/40 transition hover:bg-background/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto"
    : "inline-flex h-10 w-full items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-ink transition hover:bg-[#e6c97a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background sm:w-auto";

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
