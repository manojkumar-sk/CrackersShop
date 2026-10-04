import { Container } from "@/components/ui/container";

export default function AdminLoading() {
  return (
    <Container className="py-10 sm:py-14">
      <p role="status" className="text-sm text-muted">
        Loading admin
      </p>
    </Container>
  );
}
