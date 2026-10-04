import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ShopMembers } from "@/components/admin/shop-members";
import { Container } from "@/components/ui/container";
import { getPlatformShop, listShopMembers } from "@/app/(admin)/admin/(protected)/shops/actions";

export const metadata: Metadata = {
  title: "Shop members",
  robots: { index: false, follow: false },
};

type ShopMembersPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShopMembersPage({ params }: ShopMembersPageProps) {
  const { id } = await params;
  const shop = await getPlatformShop(id);

  if (!shop.ok && "missing" in shop) {
    notFound();
  }

  if (!shop.ok) {
    return (
      <Container className="py-10 sm:py-14">
        <AdminNotice
          title={
            shop.message === "You do not have permission to manage shops."
              ? "Shops are limited to platform admins"
              : "Members are unavailable"
          }
          message={
            shop.message === "You do not have permission to manage shops."
              ? "This account can manage its own shop catalogue, not other shops."
              : shop.message
          }
        />
      </Container>
    );
  }

  const members = await listShopMembers(shop.shop.id);

  if (!members.ok) {
    return (
      <Container className="py-10 sm:py-14">
        <AdminNotice title="Members are unavailable" message={members.message} />
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
        Platform
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        {shop.shop.name} members
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        <Link
          href="/admin/shops"
          className="rounded-sm text-ink underline decoration-line underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Back to shops
        </Link>
      </p>
      <ShopMembers shopId={shop.shop.id} shopName={shop.shop.name} members={members.members} />
    </Container>
  );
}
