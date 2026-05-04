import { expect, test } from "@playwright/test";
import { TOOL_REGISTRY } from "../../src/lib/registry";

for (const tool of TOOL_REGISTRY) {
  test(`renders ${tool.id}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto(tool.path);

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Bookmark", exact: true }),
    ).toBeVisible();

    if (tool.kind === "studio-subtool") {
      await expect(
        page.getByRole("tab", { name: tool.name, exact: true }),
      ).toHaveAttribute("data-state", "active");
    }

    expect(pageErrors).toEqual([]);
  });
}
