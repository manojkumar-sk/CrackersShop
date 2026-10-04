import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export function PlatformHome() {
  return (
    <Container className="py-16 sm:py-24">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Platform
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        This is the main application site.
      </h1>
      <p className="mt-3 max-w-md text-base leading-7 text-muted">
        Shops open on their own address. This site does not show a shop catalogue.
      </p>
      <div className="mt-8">
        <ButtonLink href="/admin">Open admin</ButtonLink>
      </div>
    </Container>
  );
}
