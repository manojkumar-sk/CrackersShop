import { Container } from "@/components/ui/container";

const points = [
  {
    title: "Wide selection",
    text: "Sparklers, flower pots, chakras, rockets, fancy pieces, sound crackers, gift boxes, and a milder kids range.",
  },
  {
    title: "Competitive pricing",
    text: "Featured items show the MRP next to the selling price, with the discount written out.",
  },
  {
    title: "Easy ordering",
    text: "Add what you need from the product card, then send the finished list on WhatsApp.",
  },
  {
    title: "Customer support",
    text: "Questions about a pack can go to the shop phone in the footer. Email will be listed there once it is added.",
  },
] as const;

export function Trust() {
  return (
    <section className="bg-ink py-14 text-background sm:py-16 lg:py-20">
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
            Safety and trust
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
            What you can expect from the shop.
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-background/75">
            A clear shelf, readable prices, and the shop phone in the footer.
            Follow the usual care for crackers once the order reaches you.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {points.map((point) => (
            <li key={point.title} className="rounded-[1.4rem] bg-white/10 p-5 ring-1 ring-white/15">
              <h3 className="font-display text-2xl">{point.title}</h3>
              <p className="mt-2 text-sm leading-6 text-background/75">{point.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
