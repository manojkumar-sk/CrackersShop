"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { site } from "@/lib/site";

type LogoProps = {
  tone?: "default" | "inverse";
  size?: "default" | "home" | "hero";
  onClick?: () => void;
  href?: string;
  name?: string;
  logoUrl?: string | null;
};

const logoSizes = {
  default: {
    image: "size-8 sm:size-9",
    word: "text-base sm:text-lg",
    icon: 18,
  },
  home: {
    image: "size-11 sm:size-12",
    word: "text-lg sm:text-xl",
    icon: 22,
  },
  hero: {
    image: "size-20 sm:size-28",
    word: "text-3xl sm:text-4xl",
    icon: 32,
  },
} as const;

export function Logo({
  tone = "default",
  size = "default",
  onClick,
  href = "/",
  name = site.name,
  logoUrl = null,
}: LogoProps) {
  const wordmark = tone === "inverse" ? "text-background" : "text-ink";
  const scale = logoSizes[size];
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const trigger = triggerRef.current;
    return () => trigger?.focus();
  }, [open]);

  const wordClassName = `min-w-0 font-display tracking-tight ${scale.word} ${
    size === "hero" ? "leading-tight text-balance" : "truncate leading-none"
  }`;

  return (
    <>
      {logoUrl ? (
        <span className={`flex min-w-0 items-center gap-2 sm:gap-3 ${wordmark}`}>
          <button
            ref={triggerRef}
            type="button"
            aria-label={`View ${name} logo`}
            onClick={() => {
              onClick?.();
              setOpen(true);
            }}
            className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- shop logos are served directly from storage */}
            <img
              src={logoUrl}
              alt=""
              className={`${scale.image} rounded-full object-cover`}
            />
          </button>
          <Link
            href={href}
            onClick={onClick}
            className={`rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${wordClassName}`}
          >
            {name}
          </Link>
        </span>
      ) : (
        <Link
          href={href}
          onClick={onClick}
          className={`flex min-w-0 items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:gap-3 ${wordmark}`}
        >
          <span
            aria-hidden="true"
            className={`grid ${scale.image} shrink-0 place-items-center rounded-full bg-accent-strong text-accent-foreground`}
          >
            <svg width={scale.icon} height={scale.icon} viewBox="0 0 18 18" fill="none">
              <path
                d="M9 1.75v14.5M1.75 9h14.5M4.1 4.1l9.8 9.8M13.9 4.1 4.1 13.9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className={wordClassName}>{name}</span>
        </Link>
      )}
      {open && logoUrl ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#120818]/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative max-w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="sr-only">
              {name} logo
            </h2>
            <button
              ref={closeRef}
              type="button"
              aria-label="Close logo preview"
              onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 inline-flex size-10 items-center justify-center rounded-full bg-white text-lg text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- shop logos are served directly from storage */}
            <img
              src={logoUrl}
              alt={`${name} logo`}
              className="max-h-[70vh] w-auto max-w-[min(100%,28rem)] rounded-2xl object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
