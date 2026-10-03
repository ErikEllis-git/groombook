import { SignJWT, jwtVerify } from "jose";

// Stateless session for the single dashboard user, following the Next.js
// authentication guide: a signed JWT in an httpOnly cookie.
// Kept free of `server-only` so proxy.ts and unit tests can import it.

export const SESSION_COOKIE = "groombook_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

type SessionPayload = { role: "owner" };

function secretKey(secret = process.env.SESSION_SECRET): Uint8Array {
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(secret?: string): Promise<string> {
  return new SignJWT({ role: "owner" } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey(secret));
}

export async function verifySessionToken(
  token: string | undefined,
  secret?: string,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify<SessionPayload>(
      token,
      secretKey(secret),
      { algorithms: ["HS256"] },
    );
    return payload.role === "owner";
  } catch {
    return false;
  }
}
