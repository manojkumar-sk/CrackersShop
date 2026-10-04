import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { Logo } from "@/components/brand/logo";
import { AdminNotice } from "@/components/admin/admin-notice";
import { Container } from "@/components/ui/container";
import { getAdminSession } from "@/lib/admin";

type SetPasswordPageProps = {
  searchParams: Promise<{ flow?: string }>;
};

export async function generateMetadata({
  searchParams,
}: SetPasswordPageProps): Promise<Metadata> {
  const params = await searchParams;

  return {
    title: params.flow === "reset" ? "Set new password" : "Set password",
    robots: { index: false, follow: false },
  };
}

export default async function SetPasswordPage({ searchParams }: SetPasswordPageProps) {
  const params = await searchParams;
  const reset = params.flow === "reset";
  const session = await getAdminSession();

  if (session.status === "anonymous") {
    redirect(reset ? "/admin/forgot-password?error=expired" : "/admin/login?error=invite");
  }

  if (session.status === "forbidden") {
    redirect("/admin/login?error=not-admin");
  }

  if (session.status === "unavailable") {
    return (
      <Container className="py-16">
        <AdminNotice
          title="Password setup is unavailable"
          message={
            reset
              ? "We could not verify this reset link just now. Please try it again."
              : "We could not verify this invite just now. Please try the link again."
          }
        />
      </Container>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <Logo href="/admin/login" />
        <h1 className="mt-6 font-display text-3xl tracking-tight text-ink">
          {reset ? "Set New Password" : "Set your password"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {reset
            ? `Choose a new password for ${session.email}. You will sign in again afterward.`
            : `Choose a password for ${session.email}, then continue to the shop admin.`}
        </p>
        <SetPasswordForm mode={reset ? "reset" : "invite"} />
      </div>
    </main>
  );
}
