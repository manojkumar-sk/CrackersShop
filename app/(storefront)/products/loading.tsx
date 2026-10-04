import { CatalogLoading } from "@/components/catalog/catalog-status";
import { Container } from "@/components/ui/container";

export default function ProductsLoading() {
  return (
    <Container className="py-10 sm:py-14 lg:py-16">
      <CatalogLoading label="Loading crackers" />
    </Container>
  );
}
