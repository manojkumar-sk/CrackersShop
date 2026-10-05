"use client";

import { useState } from "react";
import { maxCartQuantity } from "@/lib/cart";

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  productName?: string;
  onRemove?: () => void;
  fullWidth?: boolean;
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = maxCartQuantity,
  productName,
  onRemove,
  fullWidth = false,
}: QuantitySelectorProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);

  function commit(raw: string) {
    const trimmed = raw.trim();
    setDraft(null);

    if (!/^\d+$/.test(trimmed)) {
      return;
    }

    const next = Number(trimmed);

    if (next < min) {
      return;
    }

    onChange(Math.min(max, next));
  }

  return (
    <div
      className={`inline-flex h-11 items-center rounded-full border border-line bg-background ${
        fullWidth ? "w-full" : ""
      }`}
      role="group"
      aria-label={productName ? `Quantity for ${productName}` : "Quantity"}
    >
      <button
        type="button"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-lg text-ink transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={productName ? `Decrease quantity of ${productName}` : "Decrease quantity"}
        disabled={value <= min && !onRemove}
        onClick={() => {
          if (value <= min) {
            onRemove?.();
            return;
          }

          setDraft(null);
          onChange(value - 1);
        }}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={shown}
        aria-label={productName ? `Quantity of ${productName}` : "Quantity"}
        className={`h-11 border-0 bg-transparent text-center text-sm font-medium text-ink tabular-nums [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
          fullWidth ? "min-w-0 flex-1" : "w-14"
        }`}
        onChange={(event) => {
          const next = event.target.value;

          if (next === "" || /^\d+$/.test(next)) {
            setDraft(next);
          }
        }}
        onBlur={() => commit(shown)}
        onKeyDown={(event) => {
          if (event.key === "e" || event.key === "E" || event.key === "+" || event.key === "-" || event.key === ".") {
            event.preventDefault();
          }

          if (event.key === "Enter") {
            event.preventDefault();
            commit(shown);
          }
        }}
      />
      <button
        type="button"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-lg text-ink transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={productName ? `Increase quantity of ${productName}` : "Increase quantity"}
        disabled={value >= max}
        onClick={() => {
          setDraft(null);
          onChange(Math.min(max, value + 1));
        }}
      >
        +
      </button>
    </div>
  );
}
