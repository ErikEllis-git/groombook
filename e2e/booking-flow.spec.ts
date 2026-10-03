import { expect, test, type Page } from "@playwright/test";

// Full happy path: a customer requests an appointment, Kevin sees it on the
// dashboard, confirms it, and marks it completed.

const password = process.env.DASHBOARD_PASSWORD;

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
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
  await page.getByRole("button", { name: "Request appointment" }).click();

  await expect(page.getByText("Your name is required.")).toBeVisible();
  await expect(page.getByText("Choose a service.")).toBeVisible();
  await expect(page.getByLabel("Dog's name")).toHaveValue("Waffles");
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

  // Mark it done.
  await upcoming.getByRole("button", { name: "Mark completed" }).click();
  await expect(upcoming).toBeHidden();
  await page.getByRole("link", { name: /Completed/ }).click();
  await expect(page.locator("article", { hasText: dogName })).toBeVisible();
});
