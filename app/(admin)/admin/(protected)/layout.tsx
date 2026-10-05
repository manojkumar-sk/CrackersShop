import { redirect } from "next/navigation";
import { AdminShopGate } from "@/components/admin/admin-shop-gate";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminShell } from "@/components/admin/admin-shell";
import { Container } from "@/components/ui/container";
import { getAdminSession } from "@/lib/admin";
import { canManageShopAdmins, currentShopMessage, getCurrentShop } from "@/lib/shop";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (session.status === "anonymous") {
    redirect("/admin/login");
  }

  if (session.status === "forbidden") {
    redirect("/admin/login?error=not-admin");
  }

  if (session.status === "unavailable") {
    return (
      <Container className="py-16 sm:py-24">
        <AdminNotice
          title="Admin is unavailable"
          message="We could not verify admin access just now. Please try again in a moment."
        />
      </Container>
    );
  }

  const shop = await getCurrentShop();

  if (shop.status !== "ok" && !session.platform) {
    return (
      <Container className="py-16 sm:py-24">
        <AdminNotice
          title="Shop is unavailable"
          message={currentShopMessage(shop.status)}
        />
      </Container>
    );
  }

  const canManageAdmins =
    shop.status === "ok" &&
    canManageShopAdmins({ platform: session.platform, role: shop.shop.role });

  return (
    <AdminShell email={session.email} canManageAdmins={canManageAdmins}>
      <AdminShopGate
        shopReady={shop.status === "ok"}
        platform={session.platform}
        message={shop.status === "ok" ? "" : currentShopMessage(shop.status)}
      >
        {children}
      </AdminShopGate>
    </AdminShell>
  );
}
