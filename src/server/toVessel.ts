/**
 * Converts a single `PositionReport` message into a vessel structure.
 *
 * Written against the saved sample `data/samples/position-report.sample.json`,
 * not the documentation: field casing and nesting come from the file. In the
 * sample, coordinates appear at two levels and are written differently —
 * `MetaData.latitude` is lowercase and rounded to five decimal places,
 * `Message.PositionReport.Latitude` is capitalized and full precision. The
 * latter is used, as recorded in SPRINT-02.
 *
 * The message comes from the network, so the input is `unknown`: no field is
 * assumed to exist until checked. An invalid message does not create a
 * vessel — `null` is returned, and the caller simply moves on. A vessel at
 * coordinates 0,0 never appears: there are no default values here at all.
 *
 * Accumulating a set is out of scope here — that's B-12. The function knows
 * exactly one message and remembers nothing between calls.
 */

import type { Vessel } from "@/vessel";
import { toVesselName } from "@/vessel";

/** A field of an object, if there is an object at that position at all. */
function field(source: unknown, key: string): unknown {
  if (typeof source !== "object" || source === null) {
    return undefined;
  }

  return (source as Record<string, unknown>)[key];
}

/**
 * A number from the message. A string containing a number doesn't count as a
 * number: the task calls a coordinate given as a string invalid, and other
 * fields get no leniency either. NaN and infinities are filtered out right
 * here — comparisons against them are false, and further down they would
 * silently pass the range check.
 */
function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * A coordinate within `limit` in absolute value: 90 for latitude, 180 for
 * longitude.
 *
 * The "unavailable" values — 91 and 181 — need no separate check: they're
 * already out of range. A dedicated line for them would just repeat the
 * range check.
 */
function toCoordinate(value: unknown, limit: number): number | null {
  const number = asNumber(value);
  if (number === null || number < -limit || number > limit) {
    return null;
  }

  return number;
}

/**
 * Speed in knots. The range [0, 102.2] is closed on both ends; 102.3 means
 * "speed unavailable," and it's also the first value past the upper bound.
 *
 * Zero is returned as zero: the vessel is stationary, and that's a known
 * value, not its absence. The card will show "0 kn," not "No data."
 */
function toSpeedKnots(value: unknown): number | null {
  const number = asNumber(value);
  if (number === null || number < 0 || number > 102.2) {
    return null;
  }

  return number;
}

/**
 * Course over ground in degrees. The range [0, 360) is open at the top: 360°
 * is the same as 0°, and that's exactly the value AIS uses to mean "course
 * unavailable."
 */
function toCourseDeg(value: unknown): number | null {
  const number = asNumber(value);
  if (number === null || number < 0 || number >= 360) {
    return null;
  }

  return number;
}

/**
 * A vessel identifier from `MetaData.MMSI`. In the sample, the field arrives
 * as a number (`538002013`); in the vessel structure, `id` is a string, so
 * the number is converted to a string. A string is also accepted here: empty
 * or whitespace-only means MMSI is absent, not an identifier.
 */
function toVesselId(value: unknown): string | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  return null;
}

/**
 * The message timestamp. `MetaData.time_utc` is not ISO 8601: in the sample
 * it's `2026-09-17 17:32:03.718165747 +0000 UTC`, i.e. Go's standard time
 * rendering — a space instead of `T`, an offset without a colon, and a zone
 * name at the end. `new Date()` can't parse that string and gives Invalid
 * Date.
 *
 * The fractional part has variable length: here it's nine digits
 * (nanoseconds), in the documentation example it's six. So its length isn't
 * fixed, and extra digits are dropped — the vessel structure stores time
 * with millisecond precision.
 */
const TIME_UTC =
  /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(?:\.(\d+))? ([+-]\d{2})(\d{2})(?: \S+)?$/;

function toTimestamp(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const parts = TIME_UTC.exec(value.trim());
  if (parts === null) {
    return null;
  }

  const [, date, time, fraction, offsetHours, offsetMinutes] = parts;

  // Nanoseconds are truncated, not rounded: the ninth digit doesn't affect
  // the millisecond, and rounding would shift the mark that B-12 uses to pick
  // a vessel's newest position.
  const milliseconds = (fraction ?? "").padEnd(3, "0").slice(0, 3);

  const parsed = new Date(
    `${date}T${time}.${milliseconds}${offsetHours}:${offsetMinutes}`,
  );

  // The pattern lets nonexistent dates like 2026-13-40 through; parsing
  // itself catches those.
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

/**
 * Message → vessel, or `null` if the message has no position.
 *
 * A position is accepted only with valid coordinates, a non-empty MMSI, and
 * a parsed timestamp. Speed and course don't affect this: a vessel with
 * unknown speed is a vessel whose speed is unknown, not a missing vessel,
 * and its card will show "No data."
 *
 * The message type isn't checked here — that's the reader's job. A service
 * frame wouldn't make it through anyway: it has neither `MetaData` nor
 * `Message`, so no position would be assembled.
 */
export function toVessel(raw: unknown): Vessel | null {
  const meta = field(raw, "MetaData");
  const report = field(field(raw, "Message"), "PositionReport");

  const id = toVesselId(field(meta, "MMSI"));
  const lat = toCoordinate(field(report, "Latitude"), 90);
  const lon = toCoordinate(field(report, "Longitude"), 180);
  const timestamp = toTimestamp(field(meta, "time_utc"));

  if (id === null || lat === null || lon === null || timestamp === null) {
    return null;
  }

  // The name is padded with spaces to twenty characters (`"BERN                "`),
  // so the edges are trimmed; an empty name means its absence, and the
  // demo-shared `toVesselName` turns it into `null`.
  const shipName = field(meta, "ShipName");
  const name =
    typeof shipName === "string" ? toVesselName(shipName.trim()) : null;

  return {
    id,
    name,
    lat,
    lon,
    speedKnots: toSpeedKnots(field(report, "Sog")),
    courseDeg: toCourseDeg(field(report, "Cog")),
    timestamp,
    source: "aisstream",
  };
}
