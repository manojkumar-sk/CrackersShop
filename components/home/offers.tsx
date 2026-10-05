import Link from "next/link";
import { Container } from "@/components/ui/container";

const offers = [
  {
    kicker: "01",
    title: "Shelf discounts",
    text: "Featured pieces show a percentage off the MRP, next to the price you pay.",
  },
  {
    kicker: "02",
    title: "Mixed boxes",
    text: "Gift boxes can travel with sparklers and chakras in the same order.",
  },
  {
    kicker: "03",
    title: "Longer lists",
    text: "A bigger family order can be packed together. Ask the shop before you send it.",
  },
] as const;

export function Offers() {
  return (
    <section id="offers" className="scroll-mt-20 border-y border-line bg-[#f7efe2] py-14 sm:py-16 lg:py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase">
              Special offers
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight text-balance text-ink sm:text-5xl">
              Festival prices, shown in plain numbers.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-muted lg:justify-self-end">
            Compare the marked price with the selling price on each card. For a
            long list, the shop can pack the order as one lot.
          </p>
        </div>
        <ul className="mt-10 grid gap-4 lg:grid-cols-3">
          {offers.map((offer) => (
            <li
              key={offer.title}
              className="flex min-h-48 flex-col rounded-[1.6rem] border border-[#e4d3b4] bg-surface p-6"
            >
              <p className="font-display text-3xl text-gold">{offer.kicker}</p>
              <h3 className="mt-6 font-display text-2xl text-ink">{offer.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{offer.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Link
            href="/products"
            className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-background hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Shop the shelf
          </Link>
        </div>
      </Container>
    </section>
  );
}
