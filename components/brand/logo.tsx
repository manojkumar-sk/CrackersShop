import Link from "next/link";
import { site } from "@/lib/site";

type LogoProps = {
  tone?: "default" | "inverse";
  onClick?: () => void;
  href?: string;
  name?: string;
  logoUrl?: string | null;
};

export function Logo({
  tone = "default",
  onClick,
  href = "/",
  name = site.name,
  logoUrl = null,
}: LogoProps) {
  const wordmark = tone === "inverse" ? "text-background" : "text-ink";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex min-w-0 items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:gap-2.5 ${wordmark}`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- shop logos are served directly from storage
        <img
          src={logoUrl}
          alt=""
          className="size-8 shrink-0 rounded-full object-cover sm:size-9"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-strong text-accent-foreground sm:size-9"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 1.75v14.5M1.75 9h14.5M4.1 4.1l9.8 9.8M13.9 4.1 4.1 13.9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
      <span className="truncate font-display text-base leading-none tracking-tight sm:text-lg">
        {name}
      </span>
    </Link>
  );
}
