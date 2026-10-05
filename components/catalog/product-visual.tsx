import { badgeClassName } from "@/components/catalog/badge";
import { toneClassName } from "@/components/catalog/tone";
import { ImagePreview } from "@/components/ui/image-preview";
import type { Product } from "@/types/catalog";

export function ProductVisual({
  product,
  className = "aspect-[4/3]",
  preview = false,
}: {
  product: Product;
  className?: string;
  preview?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className} ${toneClassName[product.tone]}`}
    >
      {product.imageUrl ? (
        preview ? (
          <ImagePreview
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- public catalogue photos are served directly from storage */}
            <img
              src={product.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </ImagePreview>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- public catalogue photos are served directly from storage
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )
      ) : (
        <>
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/15"
          />
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/35"
          />
          <span className="absolute bottom-3 left-3 rounded-full bg-surface/90 px-2.5 py-1 text-xs text-muted">
            Image coming soon
          </span>
        </>
      )}
      {product.badge ? (
        <span
          className={`absolute top-3 left-3 z-10 rounded-full px-2.5 py-1 text-xs font-medium ${badgeClassName[product.badge]}`}
        >
          {product.badge}
        </span>
      ) : null}
    </div>
  );
}
