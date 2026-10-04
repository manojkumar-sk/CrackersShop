export const site = {
  name: "Cracker Store",
  description:
    "Festival crackers for home celebrations — sparklers, ground pieces, rockets, and gift boxes.",
} as const;

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#categories", label: "Categories" },
  { href: "/products", label: "Products" },
  { href: "/#offers", label: "Offers" },
  { href: "/#contact", label: "Contact" },
] as const;

const digitsPattern = /^[0-9]{10,15}$/;

export function shopWhatsAppUrl(whatsappNumber: string | null | undefined) {
  const digits = whatsappNumber?.trim() ?? "";

  if (!digitsPattern.test(digits)) {
    return null;
  }

  return `https://wa.me/${digits}`;
}

export function shopPhoneUrl(phoneNumber: string | null | undefined) {
  const digits = phoneNumber?.trim() ?? "";

  if (!digitsPattern.test(digits)) {
    return null;
  }

  return `tel:+${digits}`;
}

export function formatShopPhone(digits: string) {
  const local =
    digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;

  if (local.length === 10) {
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }

  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function shopContactDetails(shop: {
  address: string | null;
  phones: { phoneNumber: string; isWhatsapp: boolean; isPrimary: boolean }[];
  email: string | null;
  businessHours: string | null;
}) {
  const details: { key: string; label: string; value: string; href?: string }[] = [];

  if (shop.address) {
    details.push({ key: "address", label: "Address", value: shop.address });
  }

  shop.phones.forEach((phone, index) => {
    const href = phone.isWhatsapp
      ? shopWhatsAppUrl(phone.phoneNumber)
      : shopPhoneUrl(phone.phoneNumber);

    if (!href) {
      return;
    }

    details.push({
      key: `phone-${phone.phoneNumber}-${index}`,
      label: phone.isWhatsapp ? "WhatsApp" : "Phone",
      value: phone.isPrimary
        ? `${formatShopPhone(phone.phoneNumber)} · Primary`
        : formatShopPhone(phone.phoneNumber),
      href,
    });
  });

  if (shop.email) {
    details.push({
      key: "email",
      label: "Email",
      value: shop.email,
      href: `mailto:${shop.email}`,
    });
  }

  if (shop.businessHours) {
    details.push({ key: "hours", label: "Hours", value: shop.businessHours });
  }

  return details;
}
