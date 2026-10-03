import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";

/**
 * A stable, non-reversible fingerprint of the visitor's IP address, for rate
 * limiting without storing raw IPs. On Vercel, x-forwarded-for is set by the
 * platform; its first entry is the client. Returns null when unknown.
 */
export async function clientIpHash(): Promise<string | null> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
  if (!ip) return null;
  return createHmac("sha256", process.env.SESSION_SECRET ?? "")
    .update(ip)
    .digest("base64url");
}
