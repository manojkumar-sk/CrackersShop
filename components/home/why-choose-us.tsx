import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const reasons = [
  {
    title: "Quality products",
    text: "Each piece is named by type, so you can see what it is before it goes in the cart.",
    icon: <SealIcon />,
  },
  {
    title: "Great prices",
    text: "The MRP, the selling price, and the percentage off are written on the card.",
    icon: <TagIcon />,
  },
  {
    title: "Secure packaging",
    text: "Sparklers, pots, and boxes are packed as separate parts of the same order.",
    icon: <BoxIcon />,
  },
  {
    title: "Reliable delivery",
    text: "Dispatch is confirmed with you for the address on the order. It is not a blanket promise for every place.",
    icon: <RouteIcon />,
  },
] as const;

export function WhyChooseUs() {
  return (
    <section className="border-t border-line py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeading
          eyebrow="The shop"
          title="Why shop with us"
          description="A straightforward counter for festival crackers, with prices you can read at a glance."
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-10 lg:grid-cols-4">
          {reasons.map((reason) => (
            <li
              key={reason.title}
              className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
            >
              <span className="grid size-11 place-items-center rounded-full bg-[#f6e7c0] text-ink">
                {reason.icon}
              </span>
              <h3 className="mt-4 font-display text-xl text-ink">{reason.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{reason.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function SealIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 11.2 10 13l4-4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M11.2 4.5h5.3v5.3L10 16.3 4.7 11 11.2 4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="14.2" cy="7.8" r="0.9" fill="currentColor" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M4.5 7.5 11 4.5l6.5 3v7.2L11 17.7l-6.5-3V7.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M4.7 7.6 11 10.7l6.3-3.1M11 10.7v7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="6" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="15.5" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 7.2c2.2 0 3.2 2.2 4.2 4.3S14.2 15 16 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
