import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import {
  CatalogUnavailableError,
  getActiveCategories,
} from "@/lib/catalog";
import type { PublicShop } from "@/lib/shop";
import { primaryWhatsAppNumber } from "@/lib/shop-phones";
import { navLinks, shopContactDetails, shopWhatsAppUrl, site } from "@/lib/site";
import type { Category } from "@/types/catalog";

export async function Footer({ shop }: { shop: PublicShop }) {
  let categories: Category[] = [];
  let categoriesUnavailable = false;
  const contactDetails = shopContactDetails(shop);
  const chatUrl = shopWhatsAppUrl(primaryWhatsAppNumber(shop.phones));

  try {
    categories = await getActiveCategories(shop.id);
  } catch (error) {
    if (!(error instanceof CatalogUnavailableError)) {
      throw error;
    }

    categoriesUnavailable = true;
  }

  return (
    <footer id="contact" className="scroll-mt-20 bg-ink text-background">
      <Container className="grid gap-10 py-12 sm:py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo tone="inverse" name={shop.name} logoUrl={shop.logoUrl} />
          <p className="mt-4 max-w-sm text-sm leading-6 text-background/75">
            {shop.description ?? site.description}
          </p>
          {chatUrl ? (
            <a
              href={chatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground transition hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto"
            >
              Chat on WhatsApp
            </a>
          ) : (
            <p className="mt-5 text-sm leading-6 text-background/75">
              WhatsApp ordering is not available for this shop.
            </p>
          )}
        </div>
        <nav aria-label="Quick links">
          <h2 className="text-sm font-medium text-background">Quick links</h2>
          <ul className="mt-4 space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-background/75 transition hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Product categories">
          <h2 className="text-sm font-medium text-background">Categories</h2>
          {categoriesUnavailable ? (
            <p className="mt-4 text-sm text-background/75">
              Categories are unavailable right now.
            </p>
          ) : categories.length === 0 ? (
            <p className="mt-4 text-sm text-background/75">
              No categories are listed yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categories/${category.id}`}
                    className="text-sm text-background/75 transition hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>
        <div>
          <h2 className="text-sm font-medium text-background">Contact</h2>
          {contactDetails.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-background/75">
              No address, phone, or hours are listed for this shop yet.
            </p>
          ) : (
            <dl className="mt-4 space-y-3">
              {contactDetails.map((item) => (
                <div key={item.key}>
                  <dt className="text-xs tracking-[0.14em] text-background/50 uppercase">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-background/80">
                    {item.href ? (
                      <a
                        href={item.href}
                        className="transition hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                      >
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Container>
      <Container className="border-t border-white/10 py-4 text-xs text-background/55">
        © {new Date().getFullYear()} {shop.name}. All rights reserved.
      </Container>
    </footer>
  );
}
