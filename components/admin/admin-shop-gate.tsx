"use client";

import { usePathname } from "next/navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { Container } from "@/components/ui/container";

export function AdminShopGate({
  shopReady,
  message,
  platform,
  children,
}: {
  shopReady: boolean;
  message: string;
  platform: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const managingShops =
    pathname === "/admin/shops" || pathname.startsWith("/admin/shops/");

  if (!shopReady && !(platform && managingShops)) {
    return (
      <Container className="py-16 sm:py-24">
        <AdminNotice title="Shop is unavailable" message={message} />
      </Container>
    );
  }

  return children;
}
