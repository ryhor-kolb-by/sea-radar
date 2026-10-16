import { test, expect } from '@playwright/test';

/**
 * Vessel selection tests. They check only selection and the card: movement
 * isn't checked here — it was verified visually, and automated checking with
 * controlled time belongs to Release R3.
 *
 * Vessels and the card are found only by data attributes. Text and classes
 * aren't used for lookup: the name comes from the crew and can be anything,
 * and classes are a styling detail.
 */

const VESSEL_ID = 'demo-1';

test.beforeEach(async ({ page }) => {
  // Map tiles aren't loaded: otherwise the test would depend on the network
  // and on tile.openstreetmap.org being available. Leaflet draws vessel
  // icons itself, without tiles.
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
  await page.goto('/');
});

test('Page contains three elements with data-vessel-id', async ({ page }) => {
  await expect(page.locator('[data-vessel-id]')).toHaveCount(3);
});

test('Clicking a vessel opens that vessel’s card', async ({ page }) => {
  await page.locator(`[data-vessel-id="${VESSEL_ID}"]`).click();

  await expect(page.locator(`[data-card-vessel-id="${VESSEL_ID}"]`)).toBeVisible();
  // There's exactly one card on the page: the selected vessel's card is open, not another one alongside it.
  await expect(page.locator('[data-card-vessel-id]')).toHaveCount(1);
});

test('Clicking the same vessel again does not close the card', async ({ page }) => {
  const vessel = page.locator(`[data-vessel-id="${VESSEL_ID}"]`);
  const card = page.locator(`[data-card-vessel-id="${VESSEL_ID}"]`);

  await vessel.click();
  await expect(card).toBeVisible();

  await vessel.click();
  await expect(card).toBeVisible();
});
