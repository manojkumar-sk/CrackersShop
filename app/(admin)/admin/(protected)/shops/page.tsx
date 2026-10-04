import type { Metadata } from "next";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ShopTable } from "@/components/admin/shop-table";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { listPlatformShops } from "@/app/(admin)/admin/(protected)/shops/actions";

export const metadata: Metadata = {
  title: "Shops",
  robots: { index: false, follow: false },
};

type ShopsPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function ShopsPage({ searchParams }: ShopsPageProps) {
  const params = await searchParams;
  const result = await listPlatformShops();

  if (!result.ok) {
    const denied = result.message === "You do not have permission to manage shops.";

    return (
      <Container className="py-10 sm:py-14">
        <AdminNotice
          title={denied ? "Shops are limited to platform admins" : "Shops are unavailable"}
          message={
            denied
              ? "This account can manage its own shop catalogue, not other shops."
              : result.message
          }
        />
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
            Platform
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Shops
          </h1>
        </div>
        <ButtonLink href="/admin/shops/new">Create Shop</ButtonLink>
      </div>
      <ShopTable shops={result.shops} notice={params.notice} />
    </Container>
  );
}
