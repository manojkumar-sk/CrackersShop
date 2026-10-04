import type { Metadata } from "next";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ProductTable } from "@/components/admin/product-table";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import {
  AdminUnavailableError,
  getAdminCategories,
  getAdminProducts,
  type AdminCategory,
  type AdminProduct,
} from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin products",
  robots: { index: false, follow: false },
};

type AdminProductsPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const params = await searchParams;
  let products: AdminProduct[] = [];
  let categories: AdminCategory[] = [];
  let unavailable = false;

  try {
    [products, categories] = await Promise.all([
      getAdminProducts(),
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
          title="Products are unavailable"
          message="We could not load the product list just now. Please try again in a moment."
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
            Products
          </h1>
        </div>
        <ButtonLink href="/admin/products/new">Add Product</ButtonLink>
      </div>
      <ProductTable
        products={products}
        categories={categories}
        notice={params.notice}
      />
    </Container>
  );
}
