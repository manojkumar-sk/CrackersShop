import type { Metadata } from "next";
import { getAdminPriceList } from "@/app/(admin)/admin/(protected)/price-list/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { PriceListManager } from "@/components/admin/price-list-manager";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Price list",
  robots: { index: false, follow: false },
};

const uploadedFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function PriceListPage() {
  const result = await getAdminPriceList();
  const uploadedLabel =
    result.ok && result.priceList
      ? uploadedFormat.format(new Date(result.priceList.uploadedAt))
      : null;

  return (
    <Container className="py-8 sm:py-10">
      <p className="text-xs font-semibold tracking-[0.18em] text-accent-strong uppercase">
        Catalogue
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">Price list</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
        Upload the shop&apos;s official price-list PDF. Customers can open it from the products page.
      </p>
      {result.ok ? (
        <PriceListManager priceList={result.priceList} uploadedLabel={uploadedLabel} />
      ) : (
        <div className="mt-8">
          <AdminNotice title="The price list is unavailable" message={result.message} />
        </div>
      )}
    </Container>
  );
}
