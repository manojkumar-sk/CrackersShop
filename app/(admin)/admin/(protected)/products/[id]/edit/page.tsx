import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ProductForm } from "@/components/admin/product-form";
import { Container } from "@/components/ui/container";
import { updateProduct } from "@/app/(admin)/admin/(protected)/products/actions";
import {
  AdminUnavailableError,
  getAdminCategories,
  getAdminProduct,
  type AdminCategory,
  type AdminProduct,
} from "@/lib/admin";
import { isUuid } from "@/lib/product-input";

export const metadata: Metadata = {
  title: "Edit product",
  robots: { index: false, follow: false },
};

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  let product: AdminProduct | null = null;
  let categories: AdminCategory[] = [];
  let unavailable = false;

  try {
    [product, categories] = await Promise.all([
      getAdminProduct(id),
      getAdminCategories(),
    ]);
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
          message="We could not load this product just now. Please try again in a moment."
        />
      </Container>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <Container className="py-10 sm:py-14">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Catalogue
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Edit product
      </h1>
      <ProductForm
        categories={categories}
        product={product}
        action={updateProduct.bind(null, product.id)}
      />
    </Container>
  );
}
