import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import {
  AdminUnavailableError,
  getAdminSession,
  getAdminSummary,
} from "@/lib/admin";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (session.status !== "admin") {
    redirect("/admin/login");
  }

  let summary: Awaited<ReturnType<typeof getAdminSummary>> | null = null;
  let unavailable = false;

  try {
    summary = await getAdminSummary();
  } catch (error) {
    if (!(error instanceof AdminUnavailableError)) {
      throw error;
    }

    unavailable = true;
  }

  if (unavailable || !summary) {
    return (
      <Container className="py-10 sm:py-14">
        <AdminNotice
          title="The dashboard is unavailable"
          message="We could not load the catalogue counts just now. Please try again in a moment."
        />
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Admin
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Dashboard
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Signed in as {session.email}
      </p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-sm text-muted">Products</dt>
          <dd className="mt-2 font-display text-4xl text-ink">
            {summary.productCount}
          </dd>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-sm text-muted">Categories</dt>
          <dd className="mt-2 font-display text-4xl text-ink">
            {summary.categoryCount}
          </dd>
        </div>
      </dl>
      <div className="mt-8">
        <ButtonLink href="/admin/products">Products</ButtonLink>
      </div>
    </Container>
  );
}
