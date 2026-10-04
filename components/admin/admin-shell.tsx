import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";

export function AdminShell({
  email,
  platform,
  children,
}: {
  email: string;
  platform: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        Skip to admin content
      </a>
      <header className="border-b border-line bg-surface">
        <Container className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <Logo href="/admin/dashboard" />
            <p className="truncate text-sm text-muted">{email}</p>
          </div>
          <nav aria-label="Admin" className="sm:ml-auto">
            <AdminNav platform={platform} />
          </nav>
        </Container>
      </header>
      <main id="admin-main" className="flex-1">
        {children}
      </main>
    </div>
  );
}
