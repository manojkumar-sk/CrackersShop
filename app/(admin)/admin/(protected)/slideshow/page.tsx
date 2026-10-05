import type { Metadata } from "next";
import { listSlides } from "@/app/(admin)/admin/(protected)/slideshow/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { SlideshowManager } from "@/components/admin/slideshow-manager";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Admin slideshow",
  robots: { index: false, follow: false },
};

export default async function SlideshowPage() {
  const result = await listSlides();

  return (
    <Container className="py-8 sm:py-10">
      <p className="text-xs font-semibold tracking-[0.18em] text-accent-strong uppercase">
        Homepage
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">Slideshow</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
        These banners fill the top of the storefront. Change the picture, the
        words, or the buttons here and the homepage updates on the next visit.
      </p>
      {result.ok ? (
        <SlideshowManager slides={result.slides} />
      ) : (
        <div className="mt-8">
          <AdminNotice title="Slideshow is unavailable" message={result.message} />
        </div>
      )}
    </Container>
  );
}
