/**
 * Display name used in the PDF footer, the email header and the subject line.
 *
 * `NEXT_PUBLIC_SITE_NAME` is inlined at build time, so the fallback is what
 * ships if the variable is missing from the deployment environment.
 */
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Число имени'
