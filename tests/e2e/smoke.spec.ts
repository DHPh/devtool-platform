import { expect, test } from "@playwright/test";

test("opens the maintained tools catalog", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /free developer tools/i })
  ).toBeVisible();

  await page.getByRole("link", { name: "Browse All Tools" }).click();

  await expect(page).toHaveURL(/\/tools$/);
  await expect(
    page.getByRole("heading", { name: "Complete Developer Tools Collection" })
  ).toBeVisible();
});
