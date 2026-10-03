// Renders docs/one-pager.html to docs/GroomBook-MVP-Overview.pdf with fresh
// phone screenshots of the running app.
// Usage: APP_URL=https://... DASHBOARD_PASSWORD=... node scripts/render-one-pager.mjs

import { readFile, writeFile } from "node:fs/promises";
import { chromium, devices } from "@playwright/test";

const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const password = process.env.DASHBOARD_PASSWORD;
if (!password) throw new Error("Set DASHBOARD_PASSWORD.");

const browser = await chromium.launch();
const phone = await browser.newContext({ ...devices["iPhone 13"] });
const page = await phone.newPage();

await page.goto(appUrl);
const form = await page.screenshot({ type: "png" });

await page.goto(`${appUrl}/login`);
await page.getByLabel("Password").fill(password);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/dashboard");
const dash = await page.screenshot({ type: "png" });

const dataUri = (buf) => `data:image/png;base64,${buf.toString("base64")}`;
const today = new Date().toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const html = (await readFile("docs/one-pager.html", "utf8"))
  .replaceAll("{{LIVE_URL}}", appUrl)
  .replaceAll("{{LIVE_URL_TEXT}}", appUrl.replace(/^https?:\/\//, ""))
  .replaceAll("{{DATE}}", today)
  .replaceAll("{{SHOT_FORM}}", dataUri(form))
  .replaceAll("{{SHOT_DASH}}", dataUri(dash));

const doc = await browser.newPage({ viewport: { width: 816, height: 1056 } });
await doc.setContent(html, { waitUntil: "load" });
const pdf = await doc.pdf({ format: "Letter", printBackground: true });
await writeFile("docs/GroomBook-MVP-Overview.pdf", pdf);
await doc.screenshot({ path: "docs/.one-pager-preview.png", fullPage: true });

await browser.close();
console.log("Wrote docs/GroomBook-MVP-Overview.pdf");
