import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export default function CategoryNotFound() {
  return (
    <Container className="py-16 sm:py-24">
      <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
        We could not find that category.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">
        It may have been deleted. Return to the category list.
      </p>
      <div className="mt-6">
        <ButtonLink href="/admin/categories">Back to categories</ButtonLink>
      </div>
    </Container>
  );
}
