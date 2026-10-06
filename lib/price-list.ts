import { getSupabase } from "@/lib/supabase";

export const maxPriceListBytes = 10 * 1024 * 1024;

export const priceListBucket = "price-lists";

export type OfficialPriceList = {
  id: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  uploadedAt: string;
};

type PriceListRow = {
  id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  uploaded_at: string;
};

export function priceListFileMessage(file: File) {
  const name = file.name.trim().toLowerCase();

  if (file.type !== "application/pdf" || !name.endsWith(".pdf")) {
    return "Upload a PDF file. Images, Word documents, and spreadsheets are not accepted.";
  }

  if (file.size <= 0) {
    return "That PDF is empty.";
  }

  if (file.size > maxPriceListBytes) {
    return "Use a PDF smaller than 10 MB.";
  }

  return null;
}

export function priceListDisplayName(name: string) {
  const base = name.split(/[/\\]/).pop()?.trim() || "price-list.pdf";
  const cleaned = base.replace(/[^\w.\- ()]+/g, "").slice(0, 180);

  if (!cleaned) {
    return "price-list.pdf";
  }

  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

export function priceListDownloadUrl(fileUrl: string, fileName: string) {
  const separator = fileUrl.includes("?") ? "&" : "?";
  return `${fileUrl}${separator}download=${encodeURIComponent(fileName)}`;
}

export function missingPriceListTable(error: { code?: string; message: string }) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message.includes("shop_price_lists")
  );
}

export function mapPriceList(row: PriceListRow): OfficialPriceList {
  return {
    id: row.id,
    fileName: row.file_name,
    filePath: row.file_path,
    fileUrl: row.file_url,
    uploadedAt: row.uploaded_at,
  };
}

export async function getOfficialPriceList(shopId: string): Promise<OfficialPriceList | null> {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("shop_price_lists")
    .select("id, file_name, file_path, file_url, uploaded_at")
    .eq("shop_id", shopId)
    .maybeSingle();

  if (error) {
    if (!missingPriceListTable(error)) {
      console.error("Official price list could not be loaded:", error.message);
    }

    return null;
  }

  if (!data?.file_url) {
    return null;
  }

  return mapPriceList(data as PriceListRow);
}
