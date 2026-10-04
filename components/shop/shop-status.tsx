import { Container } from "@/components/ui/container";

export function ShopNotFound() {
  return (
    <Container className="py-16 sm:py-24">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Shop
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Shop not found
      </h1>
      <p className="mt-3 max-w-md text-base leading-7 text-muted">
        This address is not an active shop. Check the shop link and try again.
      </p>
    </Container>
  );
}

export function ShopUnavailable() {
  return (
    <Container className="py-16 sm:py-24">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Shop
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        This shop is unavailable
      </h1>
      <p className="mt-3 max-w-md text-base leading-7 text-muted">
        We could not open the shop for this address. Please try again in a moment.
      </p>
    </Container>
  );
}
