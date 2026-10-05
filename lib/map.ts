export function mapEmbedUrl(input: {
  address: string | null;
  mapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}) {
  if (input.latitude != null && input.longitude != null) {
    return `https://maps.google.com/maps?q=${input.latitude},${input.longitude}&z=15&output=embed`;
  }

  if (input.address) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(input.address)}&z=15&output=embed`;
  }

  return null;
}

export function mapOpenUrl(input: {
  address: string | null;
  mapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}) {
  if (input.mapsUrl) {
    return input.mapsUrl;
  }

  if (input.latitude != null && input.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${input.latitude},${input.longitude}`;
  }

  if (input.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(input.address)}`;
  }

  return null;
}
