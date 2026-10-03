import { afterEach, describe, expect, it, vi } from "vitest";
import { buildNewRequestAlert, notifyOwner } from "./notify";

const request = {
  customerName: "Dana Smith",
  phone: "4345550142",
  address: "12 Elm St, Lynchburg",
  dogName: "Biscuit",
  breed: "Goldendoodle",
  dogSize: "medium",
  service: "full_groom",
  preferredDate: "2026-10-07",
  timeWindow: "morning",
  customerNotes: "Nervous around clippers",
} as const;

describe("buildNewRequestAlert", () => {
  it("summarizes the job at a glance", () => {
    const alert = buildNewRequestAlert(request, "https://example.com/dashboard");
    expect(alert.title).toBe("New booking request: Biscuit");
    expect(alert.body).toContain("Full groom for Biscuit (Goldendoodle)");
    expect(alert.body).toContain("Wed, Oct 7, morning");
    expect(alert.body).toContain("From Dana.");
    expect(alert.clickUrl).toBe("https://example.com/dashboard");
  });

  it("keeps contact details and notes out of the alert", () => {
    const { body, title } = buildNewRequestAlert(request, "https://x");
    for (const secret of ["434", "555", "Elm St", "Smith", "clippers"]) {
      expect(`${title} ${body}`).not.toContain(secret);
    }
  });
});

describe("notifyOwner", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("posts to the configured ntfy topic", async () => {
    vi.stubEnv("NTFY_TOPIC", "test-topic");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    await notifyOwner({ title: "t", body: "b", clickUrl: "https://x" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://ntfy.sh");
    expect(JSON.parse(init.body)).toMatchObject({
      topic: "test-topic",
      title: "t",
      message: "b",
      click: "https://x",
    });
  });

  it("does nothing when no channel is configured", async () => {
    vi.stubEnv("NTFY_TOPIC", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await notifyOwner({ title: "t", body: "b", clickUrl: "https://x" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never throws when a channel fails", async () => {
    vi.stubEnv("NTFY_TOPIC", "test-topic");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      notifyOwner({ title: "t", body: "b", clickUrl: "https://x" }),
    ).resolves.toBeUndefined();
  });
});
