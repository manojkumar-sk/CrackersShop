import type { Metadata } from "next";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ShopForm } from "@/components/admin/shop-form";
import { Container } from "@/components/ui/container";
import { createShop, listPlatformShops } from "@/app/(admin)/admin/(protected)/shops/actions";
import { shopPublicHostSuffix } from "@/lib/shop-host";

export const metadata: Metadata = {
  title: "Create shop",
  robots: { index: false, follow: false },
};

export default async function NewShopPage() {
  const access = await listPlatformShops();

  if (!access.ok) {
    const denied = access.message === "You do not have permission to manage shops.";

    return (
      <Container className="py-10 sm:py-14">
        <AdminNotice
          title={denied ? "Shops are limited to platform admins" : "Shops are unavailable"}
          message={
            denied
              ? "This account can manage its own shop catalogue, not other shops."
              : access.message
          }
        />
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Platform
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Create shop
      </h1>
      <ShopForm action={createShop} hostSuffix={shopPublicHostSuffix()} />
    </Container>
  );
}
