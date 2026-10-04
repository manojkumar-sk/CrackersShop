import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export function Hero() {
  return (
    <section className="border-b border-line">
      <Container className="grid items-center gap-8 py-10 sm:gap-10 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.16em] text-accent-strong uppercase">
            Festival orders
          </p>
          <h1 className="mt-3 max-w-xl font-display text-[1.875rem] leading-[1.12] tracking-tight text-balance text-ink sm:text-5xl lg:text-6xl">
            Crackers for a brighter home celebration.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted sm:mt-5 sm:text-lg">
            Sparklers, flower pots, chakras, rockets, and gift boxes from one
            shop counter. Every piece shows the marked price beside what you pay.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/#products" className="w-full sm:w-auto">
              Shop now
            </ButtonLink>
            <ButtonLink
              href="/#categories"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              View categories
            </ButtonLink>
          </div>
        </div>
        <aside className="relative overflow-hidden rounded-3xl bg-ink text-background shadow-sm">
          <FestivalMark />
          <div className="relative flex min-h-[22rem] flex-col justify-between gap-10 p-6 sm:min-h-[28rem] sm:p-8">
            <p className="max-w-[9rem] text-xs font-medium tracking-[0.16em] text-gold uppercase">
              Festival night
            </p>
            <div className="max-w-sm">
              <p className="font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
                From the first sparkler to the last gift box.
              </p>
              <p className="mt-3 text-sm leading-6 text-background/75">
                Colour and sparks stand in for the season photograph.
              </p>
            </div>
          </div>
        </aside>
      </Container>
    </section>
  );
}

function FestivalMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 160"
      className="pointer-events-none absolute top-4 right-4 size-24 sm:top-6 sm:right-6 sm:size-40"
    >
      <circle cx="80" cy="80" r="58" fill="none" stroke="#e7c98a" strokeOpacity="0.5" />
      <circle cx="80" cy="80" r="36" fill="none" stroke="#fff8f3" strokeOpacity="0.28" />
      <circle cx="80" cy="80" r="5" fill="#e7c98a" />
      <g stroke="#e7c98a" strokeWidth="2.5" strokeLinecap="round">
        <path d="M80 14v22" />
        <path d="M80 124v22" />
        <path d="M14 80h22" />
        <path d="M124 80h22" />
        <path d="M32 32l16 16" />
        <path d="M112 112l16 16" />
        <path d="M112 32l-16 16" />
        <path d="M32 112l-16 16" />
      </g>
      <circle cx="128" cy="128" r="4" fill="#c46a45" />
    </svg>
  );
}
