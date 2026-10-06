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

test('сохранённый образец преобразуется в судно с ожидаемыми полями', () => {
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

test('синтетический вариант без названия даёт null в имени', () => {
  const report = syntheticSample();
  delete report.MetaData.ShipName;

  expect(toVessel(report)?.name).toBe(null);
});

test('синтетический вариант с названием из пробелов даёт null в имени', () => {
  const report = syntheticSample();
  report.MetaData.ShipName = '   ';

  expect(toVessel(report)?.name).toBe(null);
});

test('синтетическая нулевая скорость сохраняется как 0', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Sog = 0;

  expect(toVessel(report)?.speedKnots).toBe(0);
});

test('синтетическая скорость 102.3 даёт null', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Sog = 102.3;

  expect(toVessel(report)?.speedKnots).toBe(null);
});

test('синтетическая скорость -1 даёт null', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Sog = -1;

  expect(toVessel(report)?.speedKnots).toBe(null);
});

test('синтетический вариант без скорости даёт null', () => {
  const report = syntheticSample();
  delete report.Message.PositionReport.Sog;

  expect(toVessel(report)?.speedKnots).toBe(null);
});

test('синтетический курс 360 даёт null', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Cog = 360;

  expect(toVessel(report)?.courseDeg).toBe(null);
});

test('синтетические координаты 91/181 отбрасывают позицию', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Latitude = 91;
  report.Message.PositionReport.Longitude = 181;

  expect(toVessel(report)).toBe(null);
});

test('синтетические координаты 95/-200 отбрасывают позицию', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Latitude = 95;
  report.Message.PositionReport.Longitude = -200;

  expect(toVessel(report)).toBe(null);
});

test('синтетическая координата-строка отбрасывает позицию', () => {
  const report = syntheticSample();
  report.Message.PositionReport.Latitude = '51.03990833333333';

  expect(toVessel(report)).toBe(null);
});

test('синтетический вариант без MMSI отбрасывает позицию', () => {
  const report = syntheticSample();
  delete report.MetaData.MMSI;

  expect(toVessel(report)).toBe(null);
});

test('синтетический вариант с пустым MMSI отбрасывает позицию', () => {
  const report = syntheticSample();
  report.MetaData.MMSI = '';

  expect(toVessel(report)).toBe(null);
});

test('синтетическое непарсимое время отбрасывает позицию', () => {
  const report = syntheticSample();
  report.MetaData.time_utc = 'not-a-time';

  expect(toVessel(report)).toBe(null);
});
