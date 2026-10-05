"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/brand/logo";
import { useCart } from "@/components/cart/cart-provider";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { useDisclosure } from "@/hooks/use-disclosure";
import { navLinks } from "@/lib/site";

const desktopNavQuery = "(min-width: 1024px)";

export function Navbar({
  shopName,
  logoUrl,
}: {
  shopName: string;
  logoUrl: string | null;
}) {
  const pathname = usePathname();
  const { isOpen, close, toggle } = useDisclosure();
  const { ready, itemCount } = useCart();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia(desktopNavQuery);
    const closeOnDesktop = () => {
      if (desktop.matches) {
        close();
      }
    };

    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [close]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    firstLinkRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        toggleRef.current?.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, close]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/95 backdrop-blur-md">
      <div className="h-1 bg-accent-strong" aria-hidden="true" />
      <Container className="flex h-16 items-center gap-3">
        <Logo
          name={shopName}
          logoUrl={logoUrl}
          onClick={close}
          size={pathname === "/" ? "home" : "default"}
        />
        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center justify-center gap-x-5 xl:gap-x-7 lg:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm whitespace-nowrap text-ink/80 transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden lg:block">
            <ButtonLink href="/products">Shop now</ButtonLink>
          </div>
          <Link
            href="/cart"
            aria-label={
              ready
                ? `Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`
                : "Cart"
            }
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-2.5 text-sm font-medium text-ink transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3"
          >
            <BagIcon />
            <span className="hidden sm:inline">Cart</span>
            {ready ? (
              <span className="grid min-w-5 place-items-center rounded-full bg-accent-strong px-1.5 text-xs leading-5 text-accent-foreground">
                {itemCount}
              </span>
            ) : null}
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden"
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            onClick={toggle}
          >
            <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
            {isOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </Container>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none lg:hidden ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          aria-hidden={!isOpen}
          inert={!isOpen}
          className="min-h-0 overflow-hidden bg-background"
        >
          <Container
            className={`flex max-h-[calc(100dvh-4.25rem)] flex-col gap-1 overflow-y-auto py-3 ${
              isOpen ? "border-t border-line" : ""
            }`}
          >
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                ref={index === 0 ? firstLinkRef : undefined}
                href={link.href}
                onClick={close}
                className="rounded-xl px-3 py-3 text-base text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/cart"
              onClick={close}
              className="rounded-xl px-3 py-3 text-base text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {ready ? `Cart (${itemCount})` : "Cart"}
            </Link>
            <ButtonLink href="/products" onClick={close} className="mt-2 w-full">
              Shop now
            </ButtonLink>
          </Container>
        </nav>
      </div>
    </header>
  );
}

function BagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 5.5h9l-.7 7.2a1 1 0 0 1-1 .8H5.2a1 1 0 0 1-1-.8L3.5 5.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6 5.4V4.2A2 2 0 0 1 8 2.2 2 2 0 0 1 10 4.2v1.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
