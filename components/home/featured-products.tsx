import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export function FeaturedProducts() {
  return (
    <section
      id="products"
      className="scroll-mt-20 bg-[#fffaf3] py-14 sm:py-16 lg:py-20"
    >
      <Container>
        <div className="mx-auto max-w-3xl rounded-[1.6rem] border border-line bg-white px-6 py-10 text-center shadow-[0_16px_36px_-24px_rgba(36,18,28,0.45)] sm:px-12 sm:py-14">
          <p className="text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase">
            The shelf
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight text-balance text-ink sm:text-5xl">
            Browse the full crackers collection
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted sm:text-base sm:leading-7">
            Search the shelf, filter by category, and add pieces from the shop
            list. Prices and discounts stay on every row.
          </p>
          <div className="mt-8">
            <ButtonLink href="/products">Shop Now</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
