import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;
  const initialError =
    params.error === "expired"
      ? "This reset link is invalid or has expired. Request a new one below."
      : undefined;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <Logo href="/admin/login" />
        <h1 className="mt-6 font-display text-3xl tracking-tight text-ink">
          Forgot password
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Enter the email for your admin account. We will send a link to set a new
          password.
        </p>
        <ForgotPasswordForm initialError={initialError} />
      </div>
    </main>
  );
}
