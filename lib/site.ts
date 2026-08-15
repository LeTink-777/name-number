import { SITE_URL } from "@/lib/plans";

export const APEX_HOST = "moe-chislo.online";
export const WWW_HOST = "www.moe-chislo.online";
export const VERCEL_ALIAS = "name-number-alpha.vercel.app";

/** Canonical origin used for metadata, sitemap.xml and payment return URLs. */
export const CANONICAL_ORIGIN = SITE_URL;

/**
 * Origins a YooKassa payment is allowed to return the customer to.
 * Anything outside this list is rejected so a crafted request cannot turn
 * the checkout endpoint into an open redirect.
 */
export const ALLOWED_RETURN_ORIGINS: readonly string[] = [
  `https://${WWW_HOST}`,
  `https://${APEX_HOST}`,
  `https://${VERCEL_ALIAS}`,
];

export function isAllowedReturnOrigin(origin: string): boolean {
  return ALLOWED_RETURN_ORIGINS.includes(origin);
}

/**
 * Resolves the return URL for a payment. A caller may request one of the
 * allowlisted origins; anything else silently falls back to the canonical one.
 */
export function resolveReturnUrl(requestedOrigin: unknown, planId: string): string {
  let origin = CANONICAL_ORIGIN;

  if (typeof requestedOrigin === "string" && requestedOrigin.length > 0) {
    try {
      const parsed = new URL(requestedOrigin);
      if (isAllowedReturnOrigin(parsed.origin)) {
        origin = parsed.origin;
      }
    } catch {
      // Unparseable input keeps the canonical origin.
    }
  }

  return `${origin}/success?plan=${encodeURIComponent(planId)}`;
}
