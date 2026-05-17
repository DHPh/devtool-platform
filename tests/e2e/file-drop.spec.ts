import { expect, test } from "@playwright/test";

test("dropping an image opens the same preview as the file picker", async ({ page }) => {
  await page.goto("/tools/file-processing-studio?tab=image-resizer");
  const zone = page.getByText("Click to select or drag and drop images");
  await expect(zone).toBeVisible();
  const dataTransfer = await page.evaluateHandle(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 8;
    const png = await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!)));
    const transfer = new DataTransfer();
    transfer.items.add(new File([png], "drop-example.png", { type: "image/png" }));
    return transfer;
  });
  // A browser accepts a file drop only after the dragover handler cancels the
  // default action. The server-rendered upload prompt can appear before hydration.
  await expect.poll(() => zone.evaluate((element, transfer) => {
    const drag = new DragEvent("dragover", {
      bubbles: true,
      cancelable: true,
      dataTransfer: transfer,
    });
    element.dispatchEvent(drag);
    return drag.defaultPrevented;
  }, dataTransfer)).toBe(true);
  await zone.dispatchEvent("drop", { dataTransfer });
  await expect(page.getByRole("img", { name: "drop-example.png", exact: true }).first()).toBeVisible();
  await expect(page).toHaveURL(/tab=image-resizer$/);
});
