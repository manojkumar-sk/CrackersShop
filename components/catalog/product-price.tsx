import { discountPercent, formatInr } from "@/lib/money";

export function ProductPrice({
  mrp,
  price,
  size = "card",
  showBadge = true,
}: {
  mrp: number;
  price: number;
  size?: "card" | "detail";
  showBadge?: boolean;
}) {
  const discount = discountPercent(mrp, price);
  const sellingClass =
    size === "detail"
      ? "text-3xl font-semibold text-ink tabular-nums"
      : "text-xl font-semibold text-ink tabular-nums";

  return (
    <div>
      {discount > 0 ? (
        <p className="text-sm text-muted line-through">
          <span className="sr-only">Marked price </span>
          {formatInr(mrp)}
        </p>
      ) : null}
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className={sellingClass}>
          <span className="sr-only">Selling price </span>
          {formatInr(price)}
        </p>
        {showBadge && discount > 0 ? (
          <p className="rounded-full bg-accent-strong/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-accent-strong">
            {discount}% OFF
          </p>
        ) : null}
      </div>
    </div>
  );
}
