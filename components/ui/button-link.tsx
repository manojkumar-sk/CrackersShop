import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
};

const variants = {
  primary: "bg-accent-strong text-accent-foreground hover:bg-accent-deep",
  secondary: "bg-surface text-ink ring-1 ring-line hover:bg-background",
} as const;

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  onClick,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
