import { ImagePreview } from "@/components/ui/image-preview";
import { Container } from "@/components/ui/container";
import type { ShopSponsor } from "@/lib/sponsors";

export function Sponsors({ sponsors }: { sponsors: ShopSponsor[] }) {
  if (sponsors.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#fffaf3] py-10 sm:py-12">
      <Container>
        <p className="text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase">
          Our brands
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
          Sponsors on the shelf
        </h2>
        <ul className="mt-6 flex max-w-full gap-3 overflow-x-auto overscroll-x-contain pb-1">
          {sponsors.map((sponsor) => (
            <li
              key={sponsor.id}
              className="flex w-72 shrink-0 items-center gap-3 rounded-[1.4rem] border border-line bg-white p-3 shadow-[0_12px_30px_-24px_rgba(36,18,28,0.45)]"
            >
              <ImagePreview
                src={sponsor.logoUrl}
                alt={sponsor.name}
                className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[#fffaf3] p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- sponsor logos are stored public images */}
                <img src={sponsor.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
              </ImagePreview>
              <div className="min-w-0">
                {sponsor.websiteUrl ? (
                  <a
                    href={sponsor.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display text-lg leading-tight text-ink hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {sponsor.name}
                  </a>
                ) : (
                  <p className="font-display text-lg leading-tight text-ink">{sponsor.name}</p>
                )}
                {sponsor.description ? (
                  <p className="mt-1 text-sm leading-5 text-muted">{sponsor.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
