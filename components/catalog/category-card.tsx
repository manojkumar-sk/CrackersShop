import Link from "next/link";
import { toneClassName } from "@/components/catalog/tone";
import type { Category } from "@/types/catalog";

export function CategoryCard({ category }: { category: Category }) {
  const itemCount = category.productCount ?? 0;

  return (
    <Link
      href={`/categories/${category.id}`}
      className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5"
    >
      <div
        className={`relative overflow-hidden rounded-xl ${toneClassName[category.tone]} ${
          category.imageUrl ? "aspect-[16/9]" : "h-24"
        }`}
      >
        {category.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- public category photos are served directly from storage
          <img
            src={category.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/15 transition duration-200 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/40"
            />
            <span className="absolute right-3 bottom-3 text-[11px] font-medium tracking-wide text-ink/70 uppercase">
              Preview
            </span>
          </>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg text-ink group-hover:text-accent-strong">
        {category.name}
      </h3>
      <p className="mt-2 text-sm leading-6 text-muted">{category.summary}</p>
      <p className="mt-auto pt-3 text-sm font-medium text-ink">
        {itemCount} {itemCount === 1 ? "item" : "items"}
      </p>
    </Link>
  );
}
