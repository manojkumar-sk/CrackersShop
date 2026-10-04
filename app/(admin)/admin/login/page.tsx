import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/brand/logo";
import { getAdminSession } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAdminSession();

  if (session.status === "admin") {
    redirect("/admin/dashboard");
  }

  const params = await searchParams;
  const initialError =
    params.error === "not-admin"
      ? "This account does not have admin access."
      : params.error === "invite"
        ? "The invite link is invalid or has expired. Ask a platform admin to send a new invite."
        : session.status === "unavailable"
          ? "Admin sign-in is unavailable right now."
          : undefined;
  const initialNotice =
    params.notice === "password"
      ? "Your password was updated. Sign in with the new password."
      : undefined;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <Logo href="/admin/login" />
        <h1 className="mt-6 font-display text-3xl tracking-tight text-ink">
          Admin Login
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Sign in with a platform admin or shop admin account.
        </p>
        <LoginForm initialError={initialError} initialNotice={initialNotice} />
      </div>
    </main>
  );
}
