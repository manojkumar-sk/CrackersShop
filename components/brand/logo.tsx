import Link from "next/link";
import { site } from "@/lib/site";

type LogoProps = {
  tone?: "default" | "inverse";
  size?: "default" | "home" | "hero";
  onClick?: () => void;
  href?: string;
  name?: string;
  logoUrl?: string | null;
};

const logoSizes = {
  default: {
    image: "size-8 sm:size-9",
    word: "text-base sm:text-lg",
    icon: 18,
  },
  home: {
    image: "size-11 sm:size-12",
    word: "text-lg sm:text-xl",
    icon: 22,
  },
  hero: {
    image: "size-20 sm:size-28",
    word: "text-3xl sm:text-4xl",
    icon: 32,
  },
} as const;

export function Logo({
  tone = "default",
  size = "default",
  onClick,
  href = "/",
  name = site.name,
  logoUrl = null,
}: LogoProps) {
  const wordmark = tone === "inverse" ? "text-background" : "text-ink";
  const scale = logoSizes[size];

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex min-w-0 items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:gap-3 ${wordmark}`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- shop logos are served directly from storage
        <img
          src={logoUrl}
          alt=""
          className={`${scale.image} shrink-0 rounded-full object-cover`}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`grid ${scale.image} shrink-0 place-items-center rounded-full bg-accent-strong text-accent-foreground`}
        >
          <svg width={scale.icon} height={scale.icon} viewBox="0 0 18 18" fill="none">
            <path
              d="M9 1.75v14.5M1.75 9h14.5M4.1 4.1l9.8 9.8M13.9 4.1 4.1 13.9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
      <span
        className={`min-w-0 font-display tracking-tight ${scale.word} ${
          size === "hero" ? "leading-tight text-balance" : "truncate leading-none"
        }`}
      >
        {name}
      </span>
    </Link>
  );
}
