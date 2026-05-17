import { expect, test } from "@playwright/test";

test("a failed breach lookup reports unknown", async ({ page }) => {
  await page.route("**/range/**", (route) => route.abort());
  await page.goto("/tools/password-studio?tab=analysis");
  await page.getByPlaceholder("Enter password to analyze...").fill("Demo-only-password!");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText("Breach Status Unknown", { exact: true })).toBeVisible();
  await expect(page.getByText("Safe", { exact: true })).toHaveCount(0);
});

test("the public JSON validator accepts input directly", async ({ page }) => {
  await page.goto("/tools/json-validator");
  const input = page.locator(".cm-content[contenteditable=true]").first();
  await input.fill('{"project":"demo"}');
  await expect(page.getByText("No JSON Data", { exact: true })).toHaveCount(0);
});

test("the Chinese word counter sample includes word frequency", async ({ page }) => {
  await page.goto("/tools/word-counter");
  const button = page.getByRole("button", { name: /中文 East Asian/ });
  await expect(async () => {
    await button.click();
    await expect(page.getByText("Most Frequent Words", { exact: true })).toBeVisible({ timeout: 2000 });
  }).toPass();
  const count = page.getByText("Words", { exact: true }).locator("..");
  await expect(count).not.toHaveText(/^1\s*Words$/);
});
