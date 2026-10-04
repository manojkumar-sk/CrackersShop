import type { Metadata } from "next";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ShopSettingsForm } from "@/components/admin/shop-settings-form";
import { Container } from "@/components/ui/container";
import { getShopSettings } from "@/app/(admin)/admin/(protected)/settings/actions";
import { currentShopMessage, getCurrentShop } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Shop settings",
  robots: { index: false, follow: false },
};

export default async function ShopSettingsPage() {
  const current = await getCurrentShop();

  if (current.status !== "ok") {
    return (
      <Container className="py-10 sm:py-14">
        <AdminNotice title="Shop is unavailable" message={currentShopMessage(current.status)} />
      </Container>
    );
  }

  const result = await getShopSettings();

  if (!result.ok) {
    return (
      <Container className="py-10 sm:py-14">
        <AdminNotice title="Settings are unavailable" message={result.message} />
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Shop
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Settings
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        These details appear on {result.settings.name}&apos;s public shop.
      </p>
      <ShopSettingsForm settings={result.settings} />
    </Container>
  );
}
