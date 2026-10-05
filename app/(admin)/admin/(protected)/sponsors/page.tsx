import type { Metadata } from "next";
import { listSponsors } from "@/app/(admin)/admin/(protected)/sponsors/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { SponsorManager } from "@/components/admin/sponsor-manager";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Admin sponsors",
  robots: { index: false, follow: false },
};

export default async function SponsorsPage() {
  const result = await listSponsors();

  return (
    <Container className="py-8 sm:py-10">
      <p className="text-xs font-semibold tracking-[0.18em] text-accent-strong uppercase">
        Homepage
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">Sponsors</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
        Active brands appear under the homepage banner. Hidden ones stay off the shop.
      </p>
      {result.ok ? (
        <SponsorManager sponsors={result.sponsors} />
      ) : (
        <div className="mt-8">
          <AdminNotice title="Sponsors are unavailable" message={result.message} />
        </div>
      )}
    </Container>
  );
}
