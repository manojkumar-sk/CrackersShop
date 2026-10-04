"use client";

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  productName?: string;
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 20,
  productName,
}: QuantitySelectorProps) {
  return (
    <div
      className="inline-flex items-center rounded-full border border-line bg-surface"
      role="group"
      aria-label={productName ? `Quantity for ${productName}` : "Quantity"}
    >
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-full text-lg text-ink transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-medium text-ink tabular-nums">
        {value}
      </span>
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-full text-lg text-ink transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
