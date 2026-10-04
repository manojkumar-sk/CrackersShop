export type CheckoutDetails = {
  name: string;
  mobile: string;
  address: string;
  note: string;
};

export function normalizeIndianMobile(value: string) {
  const compact = value.trim().replace(/[\s-]/g, "");

  if (/^[6-9]\d{9}$/.test(compact)) {
    return compact;
  }

  if (/^\+91[6-9]\d{9}$/.test(compact)) {
    return compact.slice(3);
  }

  if (/^91[6-9]\d{9}$/.test(compact)) {
    return compact.slice(2);
  }

  return null;
}

export function parseCheckoutDetails(fields: CheckoutDetails):
  | { ok: true; value: CheckoutDetails }
  | { ok: false; message: string } {
  const name = fields.name.trim();
  const address = fields.address.trim();
  const note = fields.note.trim();
  const mobile = normalizeIndianMobile(fields.mobile);

  if (name.length < 2) {
    return { ok: false, message: "Enter the customer name." };
  }

  if (name.length > 80) {
    return { ok: false, message: "Use a name under 80 characters." };
  }

  if (!mobile) {
    return {
      ok: false,
      message: "Enter a valid Indian mobile number, such as 9876543210.",
    };
  }

  if (address.length < 10) {
    return { ok: false, message: "Enter a delivery address of at least 10 characters." };
  }

  if (address.length > 400) {
    return { ok: false, message: "Use an address under 400 characters." };
  }

  if (note.length > 300) {
    return { ok: false, message: "Use a note under 300 characters." };
  }

  return {
    ok: true,
    value: { name, mobile, address, note },
  };
}
