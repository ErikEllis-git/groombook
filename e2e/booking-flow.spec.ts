import { expect, test, type Page } from "@playwright/test";

// Full happy path: a customer requests an appointment, Kevin sees it on the
// dashboard, confirms it, and marks it completed.

const password = process.env.DASHBOARD_PASSWORD;

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

/** Submits a complete booking request and returns the (unique) dog name. */
async function submitRequest(page: Page, prefix = "Biscuit"): Promise<string> {
  const dogName = `${prefix}-${Date.now().toString(36)}`;
  await page.goto("/");
  await page.getByLabel("Dog's name").fill(dogName);
  await page.getByLabel("Medium (20–50 lb)").check();
  await page.getByLabel(/Full groom/).check();
  await page.getByLabel("Preferred date").fill(futureDate(3));
  await page.getByLabel("Time of day").selectOption("morning");
  await page.getByLabel("Your name").fill("Dana Smith");
  await page.getByLabel("Mobile number").fill("(434) 555-0142");
  await page.getByLabel("Address for the appointment").fill("12 Elm St, Lynchburg");
  await page.getByRole("button", { name: "Request appointment" }).click();
  await expect(page.getByRole("heading", { name: "Request received!" })).toBeVisible();
  return dogName;
}

async function signIn(page: Page) {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.beforeAll(() => {
  if (!password) throw new Error("Set DASHBOARD_PASSWORD to run e2e tests.");
});

test("shows validation errors and keeps what the customer typed", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Dog's name").fill("Waffles");
  await page.getByLabel("Medium (20–50 lb)").check();
  await page.getByLabel("Time of day").selectOption("afternoon");
  await page.getByRole("button", { name: "Request appointment" }).click();

  await expect(page.getByText("Your name is required.")).toBeVisible();
  await expect(page.getByText("Choose a service.")).toBeVisible();
  await expect(page.getByLabel("Dog's name")).toHaveValue("Waffles");
  await expect(page.getByLabel("Medium (20–50 lb)")).toBeChecked();
  await expect(page.getByLabel("Time of day")).toHaveValue("afternoon");

  // Fixing a field clears its error right away; others stay until fixed.
  await page.getByLabel("Your name").fill("Dana Smith");
  await expect(page.getByText("Your name is required.")).toBeHidden();
  await page.getByLabel(/Full groom/).check();
  await expect(page.getByText("Choose a service.")).toBeHidden();
  await expect(page.getByText("Address is required.")).toBeVisible();
});

test("dashboard requires a password", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That password isn't right.")).toBeVisible();
});

test("request → confirm → complete", async ({ page }) => {
  const dogName = `Biscuit-${Date.now().toString(36)}`;

  // Customer submits a request.
  await page.goto("/");
  await page.getByLabel("Dog's name").fill(dogName);
  await page.getByLabel("Breed").fill("Goldendoodle");
  await page.getByLabel("Medium (20–50 lb)").check();
  await page.getByLabel(/Full groom/).check();
  await page.getByLabel("Preferred date").fill(futureDate(3));
  await page.getByLabel("Time of day").selectOption("morning");
  await page.getByLabel("Your name").fill("Dana Smith");
  await page.getByLabel("Mobile number").fill("(434) 555-0142");
  await page.getByLabel("Address for the appointment").fill("12 Elm St, Lynchburg");
  await page.getByLabel(/Anything Kevin should know/).fill("Gate code 1234");
  await page.getByRole("button", { name: "Request appointment" }).click();

  await expect(page.getByRole("heading", { name: "Request received!" })).toBeVisible();
  await expect(page.getByText(`meet ${dogName}`)).toBeVisible();

  // Kevin sees it under New requests.
  await signIn(page);
  const card = page.locator("article", { hasText: dogName });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Gate code 1234");
  await expect(card.getByRole("link", { name: "(434) 555-0142" })).toHaveAttribute(
    "href",
    "tel:4345550142",
  );

  // Confirm it for 10:30.
  await card.getByLabel("Time").fill("10:30");
  await card.getByRole("button", { name: "Confirm booking" }).click();
  await expect(card).toBeHidden();

  // It now appears under Upcoming with a prefilled confirmation text.
  await page.getByRole("link", { name: /Upcoming/ }).click();
  const upcoming = page.locator("article", { hasText: dogName });
  await expect(upcoming).toContainText("10:30 AM");
  await expect(
    upcoming.getByRole("link", { name: "Text confirmation" }),
  ).toHaveAttribute("href", /^sms:4345550142\?&body=.*confirmed/);

  // Kevin texts the customer, then ticks it off.
  await expect(upcoming).toContainText("Customer not texted yet");
  await upcoming.getByRole("button", { name: "Mark text sent" }).click();
  await expect(upcoming).toContainText("Confirmation texted");

  // Mark it done.
  await upcoming.getByRole("button", { name: "Mark completed" }).click();
  await expect(upcoming).toBeHidden();
  await page.getByRole("link", { name: /Completed/ }).click();
  await expect(page.locator("article", { hasText: dogName })).toBeVisible();
});

test("a stale tab can't confirm a request that was already declined", async ({ browser }) => {
  const context = await browser.newContext();
  const tabA = await context.newPage();
  const dogName = await submitRequest(tabA, "Stale");
  await signIn(tabA);
  const tabB = await context.newPage();
  await tabB.goto("/dashboard");

  // Decline in tab B, then try to confirm from tab A's out-of-date view.
  await tabB
    .locator("article", { hasText: dogName })
    .getByRole("button", { name: "Decline" })
    .click();
  await expect(tabB.locator("article", { hasText: dogName })).toBeHidden();

  const staleCard = tabA.locator("article", { hasText: dogName });
  await staleCard.getByLabel("Time").fill("10:30");
  await staleCard.getByRole("button", { name: "Confirm booking" }).click();
  await expect(tabA.getByText("already updated elsewhere")).toBeVisible();
  await tabA.getByRole("link", { name: /Upcoming/ }).click();
  await expect(tabA.locator("article", { hasText: dogName })).toHaveCount(0);
  await context.close();
});

test("cancelled then restored bookings lose their old slot", async ({ page }) => {
  const dogName = await submitRequest(page, "Cancel");
  await signIn(page);
  const card = page.locator("article", { hasText: dogName });
  await card.getByLabel("Time").fill("11:00");
  await card.getByRole("button", { name: "Confirm booking" }).click();

  await page.getByRole("link", { name: /Upcoming/ }).click();
  await page
    .locator("article", { hasText: dogName })
    .getByRole("button", { name: "Cancel booking" })
    .click();

  await page.getByRole("link", { name: /Declined/ }).click();
  const declined = page.locator("article", { hasText: dogName });
  await expect(declined).not.toContainText("Booked for");
  await expect(declined.getByRole("link", { name: "Text confirmation" })).toHaveCount(0);
  await declined.getByRole("button", { name: "Move back to New" }).click();

  await page.getByRole("link", { name: /New requests/ }).click();
  const restored = page.locator("article", { hasText: dogName });
  await expect(restored).toContainText("Requested");
  await expect(restored.getByRole("link", { name: "Text customer" })).toBeVisible();
});

test("Kevin can't confirm a time that has already passed", async ({ page }) => {
  const dogName = await submitRequest(page, "Past");
  await signIn(page);
  const card = page.locator("article", { hasText: dogName });
  // Today at midnight has always passed (the date picker already blocks past days).
  await card.getByLabel("Date").fill(await page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }));
  await card.getByLabel("Time").fill("00:00");
  await card.getByRole("button", { name: "Confirm booking" }).click();
  await expect(card.getByText("already passed")).toBeVisible();
});
