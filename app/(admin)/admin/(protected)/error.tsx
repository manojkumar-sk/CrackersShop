"use client";

import { Container } from "@/components/ui/container";

export default function AdminError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Container className="py-16 sm:py-24">
      <h1 className="font-display text-3xl tracking-tight text-ink">
        Admin is unavailable right now.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">
        We could not load this page. Please try again in a moment.
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
