import { expect, test } from "@playwright/test";

test("opens command palette and enters history mode", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("AETHERGRID")).toBeVisible({ timeout: 15000 });
  await page.keyboard.press("Control+K");
  await expect(page.getByRole("dialog", { name: "AetherGrid command palette" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(2200);
  const slider = page.getByLabel("Replay timeline");
  await slider.fill("0");
  await expect(page.getByText("HISTORY REPLAY")).toBeVisible();
});
