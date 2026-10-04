import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="py-16 sm:py-24">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Missing page
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        We could not find that page.
      </h1>
      <p className="mt-3 max-w-md text-base leading-7 text-muted">
        The product or category is not on this shelf. Browse the full catalogue
        instead.
      </p>
      <div className="mt-6">
        <ButtonLink href="/products">All crackers</ButtonLink>
      </div>
    </Container>
  );
}
