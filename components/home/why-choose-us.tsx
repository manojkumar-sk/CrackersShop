import { Container } from "@/components/ui/container";

const reasons = [
  {
    title: "Quality products",
    text: "Each piece is named by type, so you can see what it is before it goes in the cart.",
  },
  {
    title: "Great prices",
    text: "The MRP, the selling price, and the percentage off are written on the card.",
  },
  {
    title: "Secure packaging",
    text: "Sparklers, pots, and boxes are packed as separate parts of the same order.",
  },
  {
    title: "Reliable delivery",
    text: "Dispatch is confirmed with you for the address on the order. It is not a blanket promise for every place.",
  },
] as const;

export function WhyChooseUs() {
  return (
    <section className="bg-background py-14 sm:py-16 lg:py-20">
      <Container>
        <p className="text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase">
          Why shop with us
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight tracking-tight text-balance text-ink sm:text-5xl">
          A counter you can read before you order.
        </h2>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-[1.75rem] bg-line sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, index) => (
            <li key={reason.title} className="bg-surface p-6">
              <p className="font-display text-4xl text-accent-strong">
                0{index + 1}
              </p>
              <h3 className="mt-6 font-display text-2xl text-ink">{reason.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{reason.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
