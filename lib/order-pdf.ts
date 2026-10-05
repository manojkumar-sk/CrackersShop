import type { CartItem } from "@/lib/cart";
import { cartItemCount, cartSubtotal } from "@/lib/cart";
import type { CheckoutDetails } from "@/lib/checkout";
import { formatInr } from "@/lib/money";

type OrderPdfInput = {
  shopName: string;
  logoUrl: string | null;
  details: CheckoutDetails;
  items: CartItem[];
};

export function orderPdfFilename(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `cracker-store-order-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.pdf`;
}

async function logoDataUrl(url: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();

    if (!blob.type.startsWith("image/") || blob.type.includes("svg")) {
      return null;
    }

    const objectUrl = URL.createObjectURL(blob);

    try {
      const image = await loadImage(objectUrl);
      const longest = Math.max(image.naturalWidth, image.naturalHeight, 1);
      const scale = Math.min(1, 128 / longest);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");

      if (!context) {
        return null;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.85);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

function pdfAmount(amount: number) {
  return formatInr(amount).replace("₹", "Rs. ");
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image failed"));
    image.src = src;
  });
}

export async function downloadOrderPdf(input: OrderPdfInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;
  const logo = input.logoUrl ? await logoDataUrl(input.logoUrl) : null;

  if (logo) {
    doc.addImage(logo, "JPEG", margin, y, 16, 16);
  }

  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.text(input.shopName, logo ? margin + 20 : margin, y + 7);
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text("Order summary", logo ? margin + 20 : margin, y + 14);
  doc.setTextColor(20);
  y += logo ? 24 : 16;

  const rows: [string, string][] = [
    ["Name", input.details.name],
    ["Mobile", input.details.mobile],
    ["Address", input.details.address],
  ];

  if (input.details.note) {
    rows.push(["Note", input.details.note]);
  }

  for (const [label, value] of rows) {
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text(label, margin, y);
    doc.setFont("times", "normal");
    const lines = doc.splitTextToSize(value, contentWidth - 28);
    doc.text(lines, margin + 28, y);
    y += Math.max(6, lines.length * 5) + 2;
  }

  y += 4;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("Product", margin, y);
  doc.text("Qty", margin + 98, y);
  doc.text("Price", margin + 116, y);
  doc.text("Total", margin + 148, y);
  y += 3;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont("times", "normal");

  for (const item of input.items) {
    const nameLines = doc.splitTextToSize(item.name, 90);
    const rowHeight = Math.max(6, nameLines.length * 5);

    if (y + rowHeight > 280) {
      doc.addPage();
      y = 18;
    }

    doc.text(nameLines, margin, y);
    doc.text(String(item.quantity), margin + 98, y);
    doc.text(pdfAmount(item.price), margin + 116, y);
    doc.text(pdfAmount(item.price * item.quantity), margin + 148, y);
    y += rowHeight + 2;
  }

  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text(`Total items: ${cartItemCount(input.items)}`, margin, y);
  y += 7;
  doc.text(`Estimated total: ${pdfAmount(cartSubtotal(input.items))}`, margin, y);

  doc.save(orderPdfFilename());
}
