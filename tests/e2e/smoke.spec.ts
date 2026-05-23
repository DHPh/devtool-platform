import { expect, test } from "@playwright/test";

test("navigates from the homepage through the catalog to a standalone tool", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /free developer tools/i })
  ).toBeVisible();

  await page.getByRole("link", { name: "Browse All Tools" }).click();

  await expect(page).toHaveURL(/\/tools$/);
  await expect(
    page.getByRole("heading", { name: "Developer Tools Catalog" })
  ).toBeVisible();

  await page.locator('a[href="/tools/json-formatter"]').first().click();

  await expect(page).toHaveURL(/\/tools\/json-formatter$/);
  await expect(page.getByRole("button", { name: "Format JSON" }))
    .toBeVisible();
});

test("navigates from the homepage to a studio sub-tool and syncs ?tab= history", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Browse All Tools" }).click();
  await expect(page).toHaveURL(/\/tools$/);

  await page
    .locator('a[href="/tools/network-studio?tab=dns-lookup"]')
    .first()
    .click();

  await expect(page).toHaveURL(/\/tools\/network-studio\?tab=dns-lookup$/);
  await expect(
    page.getByRole("tab", { name: "DNS Lookup", exact: true }),
  ).toHaveAttribute("data-state", "active");

  await page.getByRole("tab", { name: "IP Information", exact: true }).click();
  await expect(page).toHaveURL(/\/tools\/network-studio\?tab=ip-info$/);
  await expect(
    page.getByRole("tab", { name: "IP Information", exact: true }),
  ).toHaveAttribute("data-state", "active");

  await page.goBack();
  await expect(page).toHaveURL(/\/tools\/network-studio\?tab=dns-lookup$/);
  await expect(
    page.getByRole("tab", { name: "DNS Lookup", exact: true }),
  ).toHaveAttribute("data-state", "active");
});

test("serves dynamic OpenGraph PNG images", async ({ request }) => {
  const response = await request.get("/api/og?slug=json-formatter");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
});
