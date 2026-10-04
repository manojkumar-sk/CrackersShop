import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

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
    text: "Add what you need from the product card. Sending the finished order is the next step for the shop.",
  },
  {
    title: "Customer support",
    text: "Questions about a pack can go to the shop phone in the footer. Email will be listed there once it is added.",
  },
] as const;

export function Trust() {
  return (
    <section className="border-t border-line bg-surface/60 py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeading
          eyebrow="Before you order"
          title="What you can expect"
          description="A clear shelf, readable prices, and the shop phone in the footer."
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-10">
          {points.map((point, index) => (
            <li
              key={point.title}
              className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6"
            >
              <p className="text-xs font-medium tracking-[0.14em] text-accent-strong uppercase">
                0{index + 1}
              </p>
              <h3 className="mt-2 font-display text-2xl text-ink">{point.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{point.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
