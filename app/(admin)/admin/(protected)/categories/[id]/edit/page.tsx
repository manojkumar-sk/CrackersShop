import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { CategoryForm } from "@/components/admin/category-form";
import { Container } from "@/components/ui/container";
import { updateCategory } from "@/app/(admin)/admin/(protected)/categories/actions";
import {
  AdminUnavailableError,
  getAdminCategory,
  type AdminCategory,
} from "@/lib/admin";
import { isUuid } from "@/lib/product-input";

export const metadata: Metadata = {
  title: "Edit category",
  robots: { index: false, follow: false },
};

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  let category: AdminCategory | null = null;
  let unavailable = false;

  try {
    category = await getAdminCategory(id);
  } catch (error) {
    if (!(error instanceof AdminUnavailableError)) {
      throw error;
    }

    unavailable = true;
  }

  if (unavailable) {
    return (
      <Container className="py-10 sm:py-14">
        <AdminNotice
          title="The form is unavailable"
          message="We could not load this category just now. Please try again in a moment."
        />
      </Container>
    );
  }

  if (!category) {
    notFound();
  }

  return (
    <Container className="py-10 sm:py-14">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Catalogue
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Edit category
      </h1>
      <CategoryForm
        category={category}
        action={updateCategory.bind(null, category.id)}
      />
    </Container>
  );
}
