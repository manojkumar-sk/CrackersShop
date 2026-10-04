import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/category-form";
import { Container } from "@/components/ui/container";
import { createCategory } from "@/app/(admin)/admin/(protected)/categories/actions";

export const metadata: Metadata = {
  title: "Add category",
  robots: { index: false, follow: false },
};

export default function NewCategoryPage() {
  return (
    <Container className="py-10 sm:py-14">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Catalogue
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Add category
      </h1>
      <CategoryForm action={createCategory} />
    </Container>
  );
}
