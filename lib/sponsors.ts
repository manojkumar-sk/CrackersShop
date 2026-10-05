import { getSupabase } from "@/lib/supabase";

export type ShopSponsor = {
  id: string;
  name: string;
  logoUrl: string;
  logoPath: string;
  websiteUrl: string | null;
  description: string | null;
  active: boolean;
  displayOrder: number;
};

type SponsorRow = {
  id: string;
  name: string;
  logo_url: string;
  logo_path: string;
  website_url: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
};

export function mapSponsor(row: SponsorRow): ShopSponsor {
  return {
    id: row.id,
    name: row.name.trim(),
    logoUrl: row.logo_url,
    logoPath: row.logo_path,
    websiteUrl: row.website_url?.trim() || null,
    description: row.description?.trim() || null,
    active: row.is_active,
    displayOrder: row.display_order,
  };
}

export async function getActiveSponsors(shopId: string): Promise<ShopSponsor[]> {
  const supabase = getSupabase();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("shop_sponsors")
    .select(
      "id, name, logo_url, logo_path, website_url, description, is_active, display_order",
    )
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code !== "42P01") {
      console.error("Active sponsors could not be loaded:", error.message);
    }

    return [];
  }

  return ((data ?? []) as SponsorRow[]).map(mapSponsor);
}
