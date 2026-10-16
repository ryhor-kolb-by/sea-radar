import { expect, test } from '@playwright/test';

import type { Clock, Transport } from '@/server/reader';
import { collectSnapshot } from '@/server/reader';

const WINDOW_MS = 15_000;
const STARTED_AT = '2026-02-03T04:05:06.000Z';
const P1 = { lat: 51.01, lon: 1.01 } as const;
const P2 = { lat: 51.02, lon: 1.02 } as const;

type Timer = { at: number; callback: () => void };

class FakeClock implements Clock {
  private currentMs: number;
  private nextHandle = 1;
  private readonly timers = new Map<number, Timer>();

  constructor(startedAt: string) {
    this.currentMs = Date.parse(startedAt);
  }

  now(): Date {
    return new Date(this.currentMs);
  }

  setTimer(ms: number, callback: () => void): unknown {
    const handle = this.nextHandle++;
    this.timers.set(handle, {
      at: this.currentMs + ms,
      callback,
    });
    return handle;
  }

  clearTimer(handle: unknown): void {
    this.timers.delete(handle as number);
  }

  get pendingCount(): number {
    return this.timers.size;
  }

  advanceBy(ms: number): void {
    const target = this.currentMs + ms;

    while (true) {
      const due = [...this.timers.entries()]
        .filter(([, timer]) => timer.at <= target)
        .sort((a, b) => a[1].at - b[1].at)[0];

      if (due === undefined) {
        break;
      }

      const [handle, timer] = due;
      this.currentMs = timer.at;
      this.timers.delete(handle);
      timer.callback();
    }

    this.currentMs = target;
  }
}

class FakeTransport implements Transport {
  closeCalls = 0;
  readonly sent: string[] = [];
  private openHandler: (() => void) | undefined;
  private messageHandler: ((data: string) => void) | undefined;
  private errorHandler: (() => void) | undefined;
  private closeHandler: (() => void) | undefined;

  send(payload: string): void {
    this.sent.push(payload);
  }

  close(): void {
    this.closeCalls += 1;
  }

  onOpen(handler: () => void): void {
    this.openHandler = handler;
  }

  onMessage(handler: (data: string) => void): void {
    this.messageHandler = handler;
  }

  onError(handler: () => void): void {
    this.errorHandler = handler;
  }

  onClose(handler: () => void): void {
    this.closeHandler = handler;
  }

  emitOpen(): void {
    this.openHandler?.();
  }

  emitMessage(data: string): void {
    this.messageHandler?.(data);
  }

  emitError(): void {
    this.errorHandler?.();
  }

  emitClose(): void {
    this.closeHandler?.();
  }
}

function positionReport(
  mmsi: number,
  timestamp: string,
  lat: number,
  lon: number,
  shipName: string | null = 'A',
): string {
  const timeUtc = timestamp.replace('T', ' ').replace('Z', ' +0000 UTC');

  return JSON.stringify({
    MetaData: { MMSI: mmsi, ShipName: shipName, time_utc: timeUtc },
    MessageType: 'PositionReport',
    Message: {
      PositionReport: {
        Latitude: lat,
        Longitude: lon,
        Sog: 8,
        Cog: 90,
      },
    },
  });
}

function setup(startedAt = STARTED_AT) {
  const transport = new FakeTransport();
  const clock = new FakeClock(startedAt);
  const controller = new AbortController();
  const result = collectSnapshot({
    apiKey: 'synthetic-test-key',
    transport,
    clock,
    signal: controller.signal,
  });

  return { transport, clock, controller, result };
}

function expectResourcesClosed(transport: FakeTransport, clock: FakeClock): void {
  expect(transport.closeCalls).toBe(1);
  expect(clock.pendingCount).toBe(0);
}

test('Duplicate synthetic reports for A produce one entry', async () => {
  const { transport, clock, result } = setup();
  transport.emitOpen();
  const report = positionReport(1001, '2026-01-01T12:00:00Z', P1.lat, P1.lon);
  transport.emitMessage(report);
  transport.emitMessage(report);
  clock.advanceBy(WINDOW_MS);

  const snapshot = await result;
  expect(snapshot).toMatchObject({
    ok: true,
    vessels: [{ id: '1001', lat: 51.01, lon: 1.01 }],
    reason: 'window_elapsed',
    truncated: false,
  });
  if (snapshot.ok) {
    expect(snapshot.vessels).toHaveLength(1);
  }
  expectResourcesClosed(transport, clock);
});

test('Newer synthetic P2 remains after an older P1 report', async () => {
  const { transport, clock, result } = setup();
  transport.emitOpen();
  transport.emitMessage(
    positionReport(1001, '2026-01-01T12:01:00Z', P2.lat, P2.lon),
  );
  transport.emitMessage(
    positionReport(1001, '2026-01-01T12:00:00Z', P1.lat, P1.lon),
  );
  clock.advanceBy(WINDOW_MS);

  const snapshot = await result;
  expect(snapshot).toMatchObject({
    ok: true,
    vessels: [{ id: '1001', lat: 51.02, lon: 1.02 }],
    reason: 'window_elapsed',
  });
  if (snapshot.ok) {
    expect(snapshot.vessels).toHaveLength(1);
  }
  expectResourcesClosed(transport, clock);
});

test('Equal synthetic timestamps keep the first position', async () => {
  const { transport, clock, result } = setup();
  transport.emitOpen();
  transport.emitMessage(
    positionReport(1001, '2026-01-01T12:00:00Z', P1.lat, P1.lon),
  );
  transport.emitMessage(
    positionReport(1001, '2026-01-01T12:00:00Z', P2.lat, P2.lon),
  );
  clock.advanceBy(WINDOW_MS);

  const snapshot = await result;
  expect(snapshot).toMatchObject({
    ok: true,
    vessels: [{ id: '1001', lat: 51.01, lon: 1.01 }],
    reason: 'window_elapsed',
  });
  expectResourcesClosed(transport, clock);
});

test('100 unique synthetic vessels end collection; the 101st is rejected', async () => {
  const { transport, clock, result } = setup();
  transport.emitOpen();
  for (let index = 0; index < 100; index += 1) {
    transport.emitMessage(
      positionReport(2000 + index, '2026-01-01T12:00:00Z', P1.lat, P1.lon),
    );
  }

  const snapshot = await result;
  transport.emitMessage(
    positionReport(2100, '2026-01-01T12:00:00Z', P2.lat, P2.lon),
  );

  expect(snapshot).toMatchObject({
    ok: true,
    reason: 'limit_reached',
    truncated: true,
  });
  if (snapshot.ok) {
    expect(snapshot.vessels).toHaveLength(100);
    expect(snapshot.vessels.some((vessel) => vessel.id === '2100')).toBe(false);
  }
  expectResourcesClosed(transport, clock);
});

test('100 reports for one synthetic vessel wait until the collection window ends', async () => {
  const { transport, clock, result } = setup();
  let completed = false;
  void result.then(() => {
    completed = true;
  });
  transport.emitOpen();
  for (let index = 0; index < 100; index += 1) {
    transport.emitMessage(
      positionReport(1001, '2026-01-01T12:00:00Z', P1.lat, P1.lon),
    );
  }

  expect(completed).toBe(false);
  expect(transport.closeCalls).toBe(0);
  expect(clock.pendingCount).toBe(1);
  clock.advanceBy(WINDOW_MS);

  const snapshot = await result;
  expect(snapshot).toMatchObject({
    ok: true,
    vessels: [{ id: '1001' }],
    reason: 'window_elapsed',
    truncated: false,
  });
  if (snapshot.ok) {
    expect(snapshot.vessels).toHaveLength(1);
  }
  expectResourcesClosed(transport, clock);
});

test('Live synthetic connection without messages succeeds with an empty result at window end', async () => {
  const { transport, clock, result } = setup();
  transport.emitOpen();
  clock.advanceBy(WINDOW_MS);

  const snapshot = await result;
  expect(snapshot).toMatchObject({
    ok: true,
    vessels: [],
    reason: 'window_elapsed',
    truncated: false,
  });
  if (snapshot.ok) {
    expect(snapshot.vessels).toHaveLength(0);
  }
  expectResourcesClosed(transport, clock);
});

test('Synthetic connection without open fails when the window ends', async () => {
  const { transport, clock, result } = setup();
  clock.advanceBy(WINDOW_MS);

  const outcome = await result;
  expect(outcome).toMatchObject({ ok: false, code: 'connect_failed' });
  expectResourcesClosed(transport, clock);
});

test('Synthetic socket error before open fails immediately', async () => {
  const { transport, clock, result } = setup();
  transport.emitError();

  const outcome = await result;
  expect(outcome).toMatchObject({ ok: false, code: 'connect_failed' });
  expectResourcesClosed(transport, clock);
});

test('Synthetic provider error after three reports does not return them as success', async () => {
  const { transport, clock, result } = setup();
  transport.emitOpen();
  for (let index = 0; index < 3; index += 1) {
    transport.emitMessage(
      positionReport(1001 + index, '2026-01-01T12:00:00Z', P1.lat, P1.lon),
    );
  }
  transport.emitError();

  const outcome = await result;
  expect(outcome).toMatchObject({ ok: false, code: 'provider_error' });
  expectResourcesClosed(transport, clock);
});

test('Synthetic disconnect after three reports does not return them as success', async () => {
  const { transport, clock, result } = setup();
  transport.emitOpen();
  for (let index = 0; index < 3; index += 1) {
    transport.emitMessage(
      positionReport(1001 + index, '2026-01-01T12:00:00Z', P1.lat, P1.lon),
    );
  }
  transport.emitClose();

  const outcome = await result;
  expect(outcome).toMatchObject({ ok: false, code: 'disconnected' });
  expectResourcesClosed(transport, clock);
});

test('Synthetic error after reaching the limit does not change success or complete twice', async () => {
  const { transport, clock, result } = setup();
  let completions = 0;
  const observed = result.then((snapshot) => {
    completions += 1;
    return snapshot;
  });
  transport.emitOpen();
  for (let index = 0; index < 100; index += 1) {
    transport.emitMessage(
      positionReport(3000 + index, '2026-01-01T12:00:00Z', P1.lat, P1.lon),
    );
  }
  transport.emitError();

  const snapshot = await observed;
  expect(snapshot).toMatchObject({
    ok: true,
    reason: 'limit_reached',
    truncated: true,
  });
  expect(completions).toBe(1);
  expectResourcesClosed(transport, clock);
});

test('Synthetic cancellation before window end leaves the result pending', async () => {
  const { transport, clock, controller, result } = setup();
  let completed = false;
  void result.then(
    () => {
      completed = true;
    },
    () => {
      completed = true;
    },
  );
  transport.emitOpen();
  controller.abort();
  await Promise.resolve();

  expectResourcesClosed(transport, clock);
  expect(completed).toBe(false);
});

test('Second synthetic report with a null name replaces the entire vessel', async () => {
  const { transport, clock, result } = setup();
  transport.emitOpen();
  transport.emitMessage(
    positionReport(1001, '2026-01-01T12:00:00Z', P1.lat, P1.lon, 'A'),
  );
  transport.emitMessage(
    positionReport(1001, '2026-01-01T12:01:00Z', P2.lat, P2.lon, null),
  );
  clock.advanceBy(WINDOW_MS);

  const snapshot = await result;
  expect(snapshot).toMatchObject({
    ok: true,
    vessels: [{ id: '1001', name: null, lat: 51.02, lon: 1.02 }],
    reason: 'window_elapsed',
  });
  expectResourcesClosed(transport, clock);
});

test('Synthetic collectedAt matches the controlled clock at completion', async () => {
  const { transport, clock, result } = setup('2026-01-01T00:00:00.000Z');
  transport.emitOpen();
  clock.advanceBy(WINDOW_MS);

  const snapshot = await result;
  expect(snapshot).toMatchObject({
    ok: true,
    collectedAt: new Date('2026-01-01T00:00:15.000Z'),
    reason: 'window_elapsed',
  });
  expectResourcesClosed(transport, clock);
});
