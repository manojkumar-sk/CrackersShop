"use client";

import { Container } from "@/components/ui/container";

export default function StorefrontError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Container className="py-16 sm:py-24">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Catalogue
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        The shelf is unavailable right now.
      </h1>
      <p className="mt-3 max-w-md text-base leading-7 text-muted">
        We could not load the catalogue. Please try again in a moment.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground transition hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Try again
      </button>
    </Container>
  );
}
