import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { Logo } from "@/components/brand/logo";
import { AdminNotice } from "@/components/admin/admin-notice";
import { Container } from "@/components/ui/container";
import { getAdminSession } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Set password",
  robots: { index: false, follow: false },
};

export default async function SetPasswordPage() {
  const session = await getAdminSession();

  if (session.status === "anonymous") {
    redirect("/admin/login?error=invite");
  }

  if (session.status === "forbidden") {
    redirect("/admin/login?error=not-admin");
  }

  if (session.status === "unavailable") {
    return (
      <Container className="py-16">
        <AdminNotice
          title="Password setup is unavailable"
          message="We could not verify this invite just now. Please try the link again."
        />
      </Container>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <Logo href="/admin/login" />
        <h1 className="mt-6 font-display text-3xl tracking-tight text-ink">
          Set your password
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Choose a password for {session.email}, then continue to the shop admin.
        </p>
        <SetPasswordForm />
      </div>
    </main>
  );
}
