import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

const offers = [
  {
    title: "Shelf discounts",
    text: "Featured pieces show a percentage off the MRP, next to the price you pay.",
  },
  {
    title: "Mixed boxes",
    text: "Gift boxes can travel with sparklers and chakras in the same order.",
  },
  {
    title: "Longer lists",
    text: "A bigger family order can be packed together. Ask the shop before you send it.",
  },
] as const;

export function Offers() {
  return (
    <section id="offers" className="scroll-mt-20 py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="overflow-hidden rounded-3xl bg-ink text-background shadow-sm">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-12 lg:items-center lg:p-10">
            <div className="min-w-0 lg:col-span-6">
              <p className="text-xs font-medium tracking-[0.16em] text-gold uppercase">
                Offers
              </p>
              <h2 className="mt-2 font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
                Festival prices, shown in plain numbers.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-background/75">
                Compare the marked price with the selling price on each card.
                For a long list, the shop can pack the order as one lot.
              </p>
              <div className="mt-6">
                <ButtonLink href="/#products" className="w-full sm:w-auto">
                  Shop now
                </ButtonLink>
              </div>
            </div>
            <ul className="grid gap-3 lg:col-span-6">
              {offers.map((offer) => (
                <li
                  key={offer.title}
                  className="rounded-2xl bg-white/10 px-4 py-4 ring-1 ring-white/15 sm:px-5"
                >
                  <h3 className="font-display text-xl text-background">
                    {offer.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-background/75">
                    {offer.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
