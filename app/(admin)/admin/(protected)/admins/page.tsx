import type { Metadata } from "next";
import { AdminStaff } from "@/components/admin/admin-staff";
import { AdminNotice } from "@/components/admin/admin-notice";
import { Container } from "@/components/ui/container";
import { listCrackerStoreAdmins } from "@/app/(admin)/admin/(protected)/admins/actions";

export const metadata: Metadata = {
  title: "Admins",
  robots: { index: false, follow: false },
};

export default async function AdminsPage() {
  const result = await listCrackerStoreAdmins();

  if (!result.ok) {
    const denied = result.message === "Only an Owner can add or remove admins.";

    return (
      <Container className="py-10 sm:py-14">
        <AdminNotice
          title={denied ? "Admins are limited to the Owner" : "Admins are unavailable"}
          message={
            denied
              ? "This account can manage the catalogue. Adding, removing, and resetting admin passwords is limited to the Owner."
              : result.message
          }
        />
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Shop
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Admins
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Create staff accounts directly with an email and password. Owners can also reset staff
        passwords when needed.
      </p>
      <AdminStaff shopName={result.shopName} members={result.members} />
    </Container>
  );
}
