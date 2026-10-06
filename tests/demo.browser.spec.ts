import { expect, test, type Locator, type Page } from '@playwright/test';

const TILE_URL = 'https://tile.openstreetmap.org/**';
const SNAPSHOT_URL = '**/api/snapshot';
const START_TIME = '2026-09-24T12:00:00.000Z';

async function blockTiles(page: Page): Promise<void> {
  await page.route(TILE_URL, (route) => route.abort());
}

function cardField(card: Locator, index: number): Locator {
  return card.locator('dd').nth(index);
}

test('демо-судно двигается, а карточка показывает новые координаты', async ({ page }) => {
  await page.clock.install({ time: new Date(START_TIME) });
  await blockTiles(page);
  await page.goto('/');

  const vessel = page.locator('[data-vessel-id="demo-1"]');
  await vessel.click();
  const card = page.locator('[data-card-vessel-id="demo-1"]');
  const coordinates = cardField(card, 2);
  await expect(coordinates).toHaveText('51.00000, 1.45000');

  const before = await vessel.boundingBox();
  expect(before).not.toBeNull();

  await page.clock.runFor(4_000);

  const after = await vessel.boundingBox();
  expect(after).not.toBeNull();
  expect(after!.x).not.toBe(before!.x);
  expect(after!.y).not.toBe(before!.y);
  await expect(coordinates).toHaveText('50.96000, 1.35000');
});

test('демо-судно останавливается в конце маршрута и сохраняет последние данные', async ({ page }) => {
  await page.clock.install({ time: new Date(START_TIME) });
  await blockTiles(page);
  await page.goto('/');

  const vessel = page.locator('[data-vessel-id="demo-1"]');
  await vessel.click();
  const card = page.locator('[data-card-vessel-id="demo-1"]');
  const coordinates = cardField(card, 2);
  const speed = cardField(card, 3);
  const course = cardField(card, 4);
  const timestamp = cardField(card, 5);

  await page.clock.runFor(9 * 2_000);
  await expect(coordinates).toHaveText('50.85000, 1.00000');
  await expect(speed).toHaveText('0 уз');
  await expect(course).toHaveText('252°');
  await expect(timestamp).toHaveText('12:00:18 UTC');

  const finalPosition = await vessel.boundingBox();
  expect(finalPosition).not.toBeNull();

  await page.clock.runFor(4 * 2_000);

  const afterEnd = await vessel.boundingBox();
  expect(afterEnd).not.toBeNull();
  expect(afterEnd!.x).toBe(finalPosition!.x);
  expect(afterEnd!.y).toBe(finalPosition!.y);
  await expect(coordinates).toHaveText('50.85000, 1.00000');
  await expect(speed).toHaveText('0 уз');
  await expect(course).toHaveText('252°');
  await expect(timestamp).toHaveText('12:00:18 UTC');
});

test('ошибка снимка показывает отсутствие судов и сообщение ошибки', async ({ page }) => {
  await blockTiles(page);
  await page.route(SNAPSHOT_URL, (route) =>
    route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: false,
        attemptedAt: '2026-09-24T12:00:00.000Z',
        error: { code: 'provider_error', message: 'синтетическая ошибка' },
      }),
    }),
  );
  await page.goto('/');

  await page.getByRole('button', { name: 'Загрузить настоящие позиции' }).click();

  await expect(page.locator('[data-vessel-id]')).toHaveCount(0);
  await expect(page.getByText('Данных на карте нет', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Не удалось получить данные: синтетическая ошибка', { exact: true }),
  ).toBeVisible();
});

test('пустой снимок показывает ноль судов и сообщение об отсутствии позиций', async ({ page }) => {
  await blockTiles(page);
  await page.route(SNAPSHOT_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        vessels: [],
        collectedAt: '2026-09-24T12:00:00.000Z',
        windowSeconds: 15,
        count: 0,
        truncated: false,
        reason: 'window_elapsed',
      }),
    }),
  );
  await page.goto('/');

  await page.getByRole('button', { name: 'Загрузить настоящие позиции' }).click();

  await expect(page.locator('[data-vessel-id]')).toHaveCount(0);
  await expect(page.getByText('судов: 0')).toBeVisible();
  await expect(
    page.getByText('За время сбора позиции не получены', { exact: true }),
  ).toBeVisible();
});

test('снимок без скорости и курса показывает Нет данных и нейтральный значок', async ({ page }) => {
  await blockTiles(page);
  await page.route(SNAPSHOT_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        vessels: [
          {
            id: 'synthetic-neutral-1',
            name: 'Synthetic vessel',
            lat: 51.01,
            lon: 1.42,
            speedKnots: null,
            courseDeg: null,
            timestamp: '2026-09-24T12:00:00.000Z',
            source: 'aisstream',
          },
        ],
        collectedAt: '2026-09-24T12:00:00.000Z',
        windowSeconds: 15,
        count: 1,
        truncated: false,
        reason: 'window_elapsed',
      }),
    }),
  );
  await page.goto('/');

  await page.getByRole('button', { name: 'Загрузить настоящие позиции' }).click();

  const marker = page.locator('[data-vessel-id="synthetic-neutral-1"]');
  await expect(marker).toHaveAttribute('data-icon', 'neutral');
  await marker.click();
  const card = page.locator('[data-card-vessel-id="synthetic-neutral-1"]');
  await expect(cardField(card, 3)).toHaveText('Нет данных');
  await expect(cardField(card, 4)).toHaveText('Нет данных');
});
