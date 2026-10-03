import { describe, expect, it } from "vitest";
import { signSession, verifySessionToken } from "./session";

const SECRET = "test-secret-that-is-at-least-32-characters-long";

describe("session tokens", () => {
  it("verifies a token it signed", async () => {
    const token = await signSession(SECRET);
    expect(await verifySessionToken(token, SECRET)).toBe(true);
  });

  it("rejects missing, tampered and wrongly signed tokens", async () => {
    const token = await signSession(SECRET);
    expect(await verifySessionToken(undefined, SECRET)).toBe(false);
    expect(await verifySessionToken(`${token}x`, SECRET)).toBe(false);
    expect(
      await verifySessionToken(token, "a-different-secret-also-32-chars-long!!"),
    ).toBe(false);
  });

  it("refuses to run with a weak secret", async () => {
    await expect(signSession("short")).rejects.toThrow(/SESSION_SECRET/);
  });
});
