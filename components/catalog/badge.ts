import type { ProductBadge } from "@/types/catalog";

export const badgeClassName: Record<ProductBadge, string> = {
  Popular: "bg-ink text-background",
  "Best Seller": "bg-accent-strong text-accent-foreground",
};
