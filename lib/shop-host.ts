/**
 * Slug and hostname helpers kept for the shops admin UI and a later return
 * to multi-tenant routing. The storefront does not choose a shop from the host.
 */
export const shopSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const reservedShopSlugList = ["www", "admin", "app", "api", "auth"] as const;
const reservedShopSlugs = new Set<string>(reservedShopSlugList);
const domainLabelPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Development-only shop for a bare localhost host, which has no subdomain.
 * Production hostnames never use this value.
 */
export const developmentLocalShopSlug = "cracker-store";

export type HostResolution =
  | { kind: "tenant"; slug: string }
  | { kind: "platform" }
  | { kind: "unknown" };

export function isReservedShopSlug(slug: string) {
  return reservedShopSlugs.has(slug);
}

export function platformBaseDomain() {
  const domain = process.env.PLATFORM_BASE_DOMAIN?.trim().toLowerCase().replace(/\.$/, "") ?? "";

  if (
    !domain ||
    domain.includes("://") ||
    domain.includes("/") ||
    domain.includes(":") ||
    domain.includes("*") ||
    domain.includes(" ") ||
    domain.startsWith("www.") ||
    domain === "vercel.app" ||
    domain.endsWith(".vercel.app")
  ) {
    return null;
  }

  const labels = domain.split(".");

  if (labels.length < 2 || labels.some((label) => !domainLabelPattern.test(label))) {
    return null;
  }

  return domain;
}

export function shopPublicHostSuffix() {
  if (process.env.NODE_ENV === "development") {
    return ".localhost";
  }

  const domain = platformBaseDomain();
  return domain ? `.${domain}` : null;
}

function normalizeHostname(hostname: string) {
  const host = hostname
    .split(",")[0]
    ?.trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");

  if (!host || host.includes("/") || host.includes(" ") || host.includes("*")) {
    return null;
  }

  return host;
}

function tenantSlug(slug: string): HostResolution {
  if (!shopSlugPattern.test(slug) || isReservedShopSlug(slug)) {
    return { kind: "unknown" };
  }

  return { kind: "tenant", slug };
}

export function resolveHostname(hostname: string): HostResolution {
  const host = normalizeHostname(hostname);

  if (!host) {
    return { kind: "unknown" };
  }

  const bareLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]";

  if (bareLocal) {
    if (process.env.NODE_ENV !== "development") {
      return { kind: "unknown" };
    }

    return { kind: "tenant", slug: developmentLocalShopSlug };
  }

  if (host.endsWith(".localhost")) {
    const slug = host.slice(0, -".localhost".length).split(".")[0] ?? "";
    return tenantSlug(slug);
  }

  if (host === "vercel.app" || host.endsWith(".vercel.app")) {
    return { kind: "unknown" };
  }

  const domain = platformBaseDomain();

  if (!domain) {
    return { kind: "unknown" };
  }

  if (host === domain || host === `www.${domain}` || host === `admin.${domain}`) {
    return { kind: "platform" };
  }

  const suffix = `.${domain}`;

  if (host.endsWith(suffix)) {
    const slug = host.slice(0, -suffix.length);

    if (slug.includes(".")) {
      return { kind: "unknown" };
    }

    return tenantSlug(slug);
  }

  // A future custom-domain lookup can match this exact hostname before unknown.
  return { kind: "unknown" };
}
