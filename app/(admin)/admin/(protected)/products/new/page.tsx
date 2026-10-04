import type { Metadata } from "next";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ProductForm } from "@/components/admin/product-form";
import { Container } from "@/components/ui/container";
import { createProduct } from "@/app/(admin)/admin/(protected)/products/actions";
import {
  AdminUnavailableError,
  getAdminCategories,
  type AdminCategory,
} from "@/lib/admin";

export const metadata: Metadata = {
  title: "Add product",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
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

  return (
    <Container className="py-10 sm:py-14">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Catalogue
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Add product
      </h1>
      {unavailable ? (
        <div className="mt-8">
          <AdminNotice
            title="The form is unavailable"
            message="We could not load categories just now. Please try again in a moment."
          />
        </div>
      ) : categories.length === 0 ? (
        <div className="mt-8">
          <AdminNotice
            title="No categories yet"
            message="A product needs a category. Add one from Categories first."
          />
        </div>
      ) : (
        <ProductForm categories={categories} action={createProduct} />
      )}
    </Container>
  );
}
