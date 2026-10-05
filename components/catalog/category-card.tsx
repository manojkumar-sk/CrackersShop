import Link from "next/link";
import { toneClassName } from "@/components/catalog/tone";
import type { Category } from "@/types/catalog";

export function CategoryCard({ category }: { category: Category }) {
  const itemCount = category.productCount ?? 0;

  return (
    <Link
      href={`/categories/${category.id}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-[1.75rem] bg-ink shadow-[0_18px_40px_-22px_rgba(255,170,60,0.65)] ring-1 ring-white/20 transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_48px_-18px_rgba(255,110,50,0.75)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className={`absolute inset-0 ${toneClassName[category.tone]}`}>
        {category.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- public category photos are served directly from storage
          <img
            src={category.imageUrl}
            alt={category.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : null}
      </div>
      <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/10" />
      <span className="absolute inset-x-0 bottom-0 flex flex-col p-5 text-background">
        <span className="text-xs font-semibold tracking-[0.16em] text-gold uppercase">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <h3 className="mt-2 font-display text-2xl leading-tight text-balance">
          {category.name}
        </h3>
        <span className="mt-4 inline-flex h-10 w-fit items-center rounded-full bg-background px-4 text-sm font-semibold text-ink">
          Explore
        </span>
      </span>
    </Link>
  );
}
