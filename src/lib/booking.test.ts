import { describe, expect, it } from "vitest";
import {
  bookingRequestSchema,
  formatPhone,
  parseUsPhone,
  todayInTimeZone,
} from "./booking";

const TODAY = "2026-10-03";
const schema = bookingRequestSchema(TODAY);

const valid = {
  customerName: "  Dana Smith ",
  phone: "(434) 555-0142",
  email: "Dana@Example.com",
  address: "12 Elm St, Lynchburg",
  dogName: "Biscuit",
  breed: "",
  dogSize: "medium",
  service: "full_groom",
  preferredDate: "2026-10-07",
  timeWindow: "morning",
  notes: "",
};

describe("bookingRequestSchema", () => {
  it("accepts a complete request and normalizes it", () => {
    const result = schema.parse(valid);
    expect(result.customerName).toBe("Dana Smith");
    expect(result.phone).toBe("4345550142");
    expect(result.email).toBe("dana@example.com");
    expect(result.breed).toBeUndefined();
    expect(result.notes).toBeUndefined();
  });

  it("allows email to be left blank", () => {
    expect(schema.parse({ ...valid, email: "" }).email).toBeUndefined();
  });

  it("allows booking for today but not the past", () => {
    expect(schema.safeParse({ ...valid, preferredDate: TODAY }).success).toBe(true);
    const past = schema.safeParse({ ...valid, preferredDate: "2026-10-02" });
    expect(past.success).toBe(false);
  });

  it("reports a friendly error for each missing required field", () => {
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
    const fields = new Set(result.error!.issues.map((i) => i.path[0]));
    for (const f of [
      "customerName",
      "phone",
      "address",
      "dogName",
      "dogSize",
      "service",
      "preferredDate",
      "timeWindow",
    ]) {
      expect(fields).toContain(f);
    }
  });

  it("rejects bad phone numbers, emails and unknown options", () => {
    expect(schema.safeParse({ ...valid, phone: "555-1234" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, service: "teeth_whitening" }).success).toBe(false);
  });
});

describe("phone helpers", () => {
  it("accepts common US formats, with or without a country code", () => {
    for (const raw of ["(434) 555-0142", "434.555.0142", "+1 434 555 0142", "14345550142"]) {
      expect(parseUsPhone(raw)).toBe("4345550142");
    }
  });
  it("rejects extensions, letters, impossible numbers and wrong lengths", () => {
    for (const raw of ["434-555-0142 x12", "434-555-0142 ext 5", "call me", "0000000000", "134-555-0142", "434-155-0142", "555-1234", "+44 20 7946 0958"]) {
      expect(parseUsPhone(raw)).toBeNull();
    }
  });
  it("formats 10-digit numbers", () => {
    expect(formatPhone("4345550142")).toBe("(434) 555-0142");
  });
});

describe("todayInTimeZone", () => {
  it("uses the business time zone, not UTC", () => {
    // 02:00 UTC on Oct 4 is still the evening of Oct 3 in New York.
    const now = new Date("2026-10-04T02:00:00Z");
    expect(todayInTimeZone("America/New_York", now)).toBe("2026-10-03");
    expect(todayInTimeZone("UTC", now)).toBe("2026-10-04");
  });
});
