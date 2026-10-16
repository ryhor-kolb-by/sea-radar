import { expect, test } from '@playwright/test';

import sample from '../data/samples/position-report.sample.json';
import { toVessel } from '@/server/toVessel';

type SyntheticReport = {
  MetaData: Record<string, unknown>;
  Message: { PositionReport: Record<string, unknown> };
};

function syntheticSample(): SyntheticReport {
  return structuredClone(sample) as SyntheticReport;
}

test('Saved sample converts to a vessel with the expected fields', () => {
  const vessel = toVessel(sample);

  expect(vessel).not.toBeNull();
  expect(vessel).toMatchObject({
    id: '538002013',
    lat: 51.03990833333333,
    lon: 1.4093266666666666,
    speedKnots: 8,
    courseDeg: 229.4,
    timestamp: '2026-09-17T17:32:03.718Z',
  });
});

test('Synthetic report without a name returns null for the name', () => {
  const report = syntheticSample();
  delete report.MetaData.ShipName;

  expect(toVessel(report)?.name).toBe(null);
});

test('Synthetic report with a whitespace-only name returns null for the name', () => {
  const report = syntheticSample();
  report.MetaData.ShipName = '   ';

  expect(toVessel(report)?.name).toBe(null);
});

test('Synthetic zero speed is preserved as 0', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Sog = 0;

  expect(toVessel(report)?.speedKnots).toBe(0);
});

test('Synthetic speed 102.3 returns null', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Sog = 102.3;

  expect(toVessel(report)?.speedKnots).toBe(null);
});

test('Synthetic speed -1 returns null', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Sog = -1;

  expect(toVessel(report)?.speedKnots).toBe(null);
});

test('Synthetic report without speed returns null', () => {
  const report = syntheticSample();
  delete report.Message.PositionReport.Sog;

  expect(toVessel(report)?.speedKnots).toBe(null);
});

test('Synthetic course 360 returns null', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Cog = 360;

  expect(toVessel(report)?.courseDeg).toBe(null);
});

test('Synthetic coordinates 91/181 reject the position', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Latitude = 91;
  report.Message.PositionReport.Longitude = 181;

  expect(toVessel(report)).toBe(null);
});

test('Synthetic coordinates 95/-200 reject the position', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Latitude = 95;
  report.Message.PositionReport.Longitude = -200;

  expect(toVessel(report)).toBe(null);
});

test('Synthetic string coordinate rejects the position', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Latitude = '51.03990833333333';

  expect(toVessel(report)).toBe(null);
});

test('Synthetic report without MMSI rejects the position', () => {
  const report = syntheticSample();
  delete report.MetaData.MMSI;

  expect(toVessel(report)).toBe(null);
});

test('Synthetic report with an empty MMSI rejects the position', () => {
  const report = syntheticSample();
  report.MetaData.MMSI = '';

  expect(toVessel(report)).toBe(null);
});

test('Synthetic unparseable timestamp rejects the position', () => {
  const report = syntheticSample();
  report.MetaData.time_utc = 'not-a-time';

  expect(toVessel(report)).toBe(null);
});
