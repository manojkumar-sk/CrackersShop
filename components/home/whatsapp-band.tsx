import { Container } from "@/components/ui/container";

export function WhatsAppBand({ chatUrl }: { chatUrl: string | null }) {
  return (
    <section className="bg-accent-strong text-accent-foreground">
      <Container className="flex flex-col items-start gap-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-14">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-80">
            Place the order
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-tight text-balance sm:text-4xl">
            Send the cart on WhatsApp when the list is ready.
          </h2>
        </div>
        {chatUrl ? (
          <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-background hover:bg-[#3a2418] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background sm:w-auto"
          >
            Chat on WhatsApp
          </a>
        ) : (
          <p className="text-sm leading-6">
            WhatsApp ordering is not available for this shop.
          </p>
        )}
      </Container>
    </section>
  );
}
