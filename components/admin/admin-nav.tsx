"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const catalogueLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/price-list", label: "Price List" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/slideshow", label: "Slideshow" },
  { href: "/admin/settings", label: "Settings" },
];

const adminLink = { href: "/admin/admins", label: "Admins" };

export function AdminNav({ canManageAdmins }: { canManageAdmins: boolean }) {
  const pathname = usePathname();
  const links = canManageAdmins ? [...catalogueLinks, adminLink] : catalogueLinks;

  return (
    <ul className="flex flex-wrap items-center gap-1">
      {links.map((link) => {
        const active =
          link.href === "/admin/dashboard"
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-11 items-center rounded-full px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                active
                  ? "bg-ink text-background"
                  : "text-ink hover:bg-background"
              }`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
      <li>
        <form action="/admin/sign-out" method="post">
          <button
            type="submit"
            className="inline-flex h-11 items-center rounded-full px-3 text-sm font-medium text-ink transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Log out
          </button>
        </form>
      </li>
    </ul>
  );
}
