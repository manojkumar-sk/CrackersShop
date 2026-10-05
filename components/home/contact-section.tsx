import { Container } from "@/components/ui/container";
import { mapEmbedUrl, mapOpenUrl } from "@/lib/map";
import type { PublicShop } from "@/lib/shop";
import { shopContactDetails } from "@/lib/site";

export function ContactSection({ shop }: { shop: PublicShop }) {
  const details = shopContactDetails(shop);
  const embed = mapEmbedUrl(shop);
  const openUrl = mapOpenUrl(shop);

  if (details.length === 0 && !embed) {
    return null;
  }

  return (
    <section id="visit" className="bg-[#fff6ee] py-14 sm:py-16">
      <Container>
        <p className="text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase">
          Visit
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
          {shop.name}
        </h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-stretch">
          {details.length > 0 ? (
            <dl className="grid content-start gap-4 rounded-[1.6rem] border border-line bg-white p-5 sm:p-6">
              {details.map((item) => (
                <div key={item.key}>
                  <dt className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-base leading-7 text-ink">
                    {item.href ? (
                      <a
                        href={item.href}
                        className="hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
              {openUrl ? (
                <div>
                  <a
                    href={openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center rounded-full bg-accent-strong px-5 text-sm font-semibold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    View on Google Maps
                  </a>
                </div>
              ) : null}
            </dl>
          ) : null}
          {embed ? (
            <div className="overflow-hidden rounded-[1.6rem] border border-line bg-white">
              <iframe
                title={`Map of ${shop.name}`}
                src={embed}
                className="h-64 w-full sm:h-80"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
