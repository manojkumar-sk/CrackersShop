import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ShopForm } from "@/components/admin/shop-form";
import { Container } from "@/components/ui/container";
import { getPlatformShop, updateShop } from "@/app/(admin)/admin/(protected)/shops/actions";
import { shopPublicHostSuffix } from "@/lib/shop-host";

export const metadata: Metadata = {
  title: "Edit shop",
  robots: { index: false, follow: false },
};

type EditShopPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditShopPage({ params }: EditShopPageProps) {
  const { id } = await params;
  const result = await getPlatformShop(id);

  if (!result.ok && "missing" in result) {
    notFound();
  }

  if (!result.ok) {
    return (
      <Container className="py-10 sm:py-14">
        <AdminNotice
          title={
            result.message === "You do not have permission to manage shops."
              ? "Shops are limited to platform admins"
              : "This shop is unavailable"
          }
          message={
            result.message === "You do not have permission to manage shops."
              ? "This account can manage its own shop catalogue, not other shops."
              : result.message
          }
        />
      </Container>
    );
  }

  const shop = result.shop;
  const saveShop = updateShop.bind(null, shop.id);

  return (
    <Container className="py-10 sm:py-14">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Platform
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Edit {shop.name}
      </h1>
      <ShopForm shop={shop} action={saveShop} hostSuffix={shopPublicHostSuffix()} />
    </Container>
  );
}
