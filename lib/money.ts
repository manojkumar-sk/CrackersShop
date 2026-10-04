const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatInr(amount: number) {
  return inr.format(amount);
}

export function discountPercent(mrp: number, price: number) {
  if (mrp <= 0 || price >= mrp) {
    return 0;
  }

  const numerator = (mrp - price) * 100;
  const quotient = Math.trunc(numerator / mrp);
  const remainder = numerator % mrp;

  return remainder * 2 >= mrp ? quotient + 1 : quotient;
}
