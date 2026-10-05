import { getSupabase } from "@/lib/supabase";

export type ShopSlide = {
  id: string;
  imageUrl: string;
  imagePath: string;
  heading: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string | null;
  secondaryHref: string | null;
  active: boolean;
  displayOrder: number;
};

type SlideRow = {
  id: string;
  image_url: string;
  image_path: string;
  heading: string;
  description: string;
  primary_label: string;
  primary_href: string;
  secondary_label: string | null;
  secondary_href: string | null;
  is_active: boolean;
  display_order: number;
};

function mapSlide(row: SlideRow): ShopSlide {
  return {
    id: row.id,
    imageUrl: row.image_url,
    imagePath: row.image_path,
    heading: row.heading,
    description: row.description,
    primaryLabel: row.primary_label,
    primaryHref: row.primary_href,
    secondaryLabel: row.secondary_label,
    secondaryHref: row.secondary_href,
    active: row.is_active,
    displayOrder: row.display_order,
  };
}

export async function getActiveSlides(shopId: string): Promise<ShopSlide[]> {
  const supabase = getSupabase();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("shop_slides")
    .select(
      "id, image_url, image_path, heading, description, primary_label, primary_href, secondary_label, secondary_href, is_active, display_order",
    )
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Active slides could not be loaded:", error.message);
    return [];
  }

  return ((data ?? []) as SlideRow[]).map(mapSlide);
}
