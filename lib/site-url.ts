import "server-only";
import { headers } from "next/headers";

/**
 * Origin for auth emails. SITE_URL wins when it is set, including local
 * development. Otherwise the incoming request host is used.
 */
export async function configuredSiteOrigin() {
  const configured = process.env.SITE_URL?.trim().replace(/\/$/, "");

  if (configured) {
    return configured;
  }

  const headerStore = await headers();
  const host = (headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "")
    .split(",")[0]
    ?.trim();

  if (!host) {
    return null;
  }

  const forwarded = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwarded ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${proto}://${host}`;
}
