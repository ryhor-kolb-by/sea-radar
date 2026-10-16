/**
 * A single vessel structure, shared by demo and real data. It has exactly
 * the fields agreed in SPRINT-01.
 */

/** Where the vessel message came from. */
export type VesselSource = "demo" | "aisstream";

export type Vessel = {
  readonly id: string;

  /**
   * The name comes from the crew: it may be absent and may contain anything.
   * Display it only as text, never as HTML.
   */
  readonly name: string | null;

  readonly lat: number;
  readonly lon: number;

  /**
   * Speed and course: `null` means the value is absent from the message,
   * which is not the same as `0`. Hence `| null` rather than `?` — the
   * compiler forces every read site to distinguish "stationary" (`0`) from
   * "unknown" (`null`).
   * Course over ground (not heading), in the range [0, 360).
   */
  readonly speedKnots: number | null;
  readonly courseDeg: number | null;

  /** Message timestamp: ISO 8601 with a zone. */
  readonly timestamp: string;

  readonly source: VesselSource;
};

/**
 * A vessel name from the message. An empty string is not a name but its
 * absence, so it becomes `null`.
 */
export function toVesselName(raw: string): string | null {
  return raw === "" ? null : raw;
}

/** Text shown in place of any unknown value. */
export const NO_DATA = "No data";

/** Source labels for the card. */
const SOURCE_TEXT: Record<VesselSource, string> = {
  demo: "Demo data",
  aisstream: "AISStream",
};

export function formatSource(source: VesselSource): string {
  return SOURCE_TEXT[source];
}

/** Coordinates: exactly 5 decimal places, trailing zeros kept. */
export function formatPosition(lat: number, lon: number): string {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

/**
 * Speed: up to one decimal place, but without a trailing zero — "12.3 kn",
 * "12 kn", "0 kn". `0` is a stationary vessel, not missing data, so the check
 * is specifically for `null`, not for a falsy value.
 */
export function formatSpeed(speedKnots: number | null): string {
  if (speedKnots === null) {
    return NO_DATA;
  }

  // Rounding gives at most one decimal place; Number strips a trailing zero
  // ("12.0" → "12"), while integer values are left as-is.
  const rounded = Number(speedKnots.toFixed(1));
  return `${rounded} kn`;
}

/** Course: whole degrees in the range [0, 360), with a degree sign. */
export function formatCourse(courseDeg: number | null): string {
  if (courseDeg === null) {
    return NO_DATA;
  }

  // % 360 is needed because of rounding: 359.7 rounds to 360, which is the same as 0.
  return `${Math.round(courseDeg) % 360}°`;
}

/**
 * Message time as "12:00:00 UTC". Taken in UTC, not the browser's zone: a
 * vessel message doesn't depend on where the page was opened. An
 * unparseable timestamp is an unknown value, not "Invalid Date".
 */
export function formatTimestamp(timestamp: string): string {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return NO_DATA;
  }

  const time = parsed.toISOString().slice(11, 19);
  return `${time} UTC`;
}

/** Name: missing becomes "No data". Output only as text. */
export function formatName(name: string | null): string {
  return name === null ? NO_DATA : name;
}
