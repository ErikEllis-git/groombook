// Business details shown to customers. Override per deployment with env vars.
export const business = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "Kevin's Mobile Dog Grooming",
  ownerName: process.env.NEXT_PUBLIC_OWNER_NAME ?? "Kevin",
  timeZone: process.env.BUSINESS_TIMEZONE ?? "America/New_York",
  /** Public demo: show banners asking visitors to use made-up details. */
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
};

/** Absolute site URL, used for links inside notifications. */
export function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}
