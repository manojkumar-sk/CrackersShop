import type { Metadata } from "next";
import { AdminNotice } from "@/components/admin/admin-notice";
import { CategoryTable } from "@/components/admin/category-table";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import {
  AdminUnavailableError,
  getAdminCategories,
  type AdminCategory,
} from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin categories",
  robots: { index: false, follow: false },
};

type AdminCategoriesPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function AdminCategoriesPage({
  searchParams,
}: AdminCategoriesPageProps) {
  const params = await searchParams;
  let categories: AdminCategory[] = [];
  let unavailable = false;

  try {
    categories = await getAdminCategories();
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
          title="Categories are unavailable"
          message="We could not load the category list just now. Please try again in a moment."
        />
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
            Catalogue
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Categories
          </h1>
        </div>
        <ButtonLink href="/admin/categories/new">Add Category</ButtonLink>
      </div>
      <CategoryTable categories={categories} notice={params.notice} />
    </Container>
  );
}
