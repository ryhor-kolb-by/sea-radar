/**
 * Agreed project values. The area, initial view, map layer, and demo vessels
 * live only here — these numbers and strings are not repeated anywhere else.
 */

import { formatSource } from "@/vessel";

/** Strait of Dover: the area's southwest and northeast corners. */
export const AREA_BOUNDS = {
  south: 50.75,
  west: 0.95,
  north: 51.25,
  east: 1.95,
} as const;

/** Map view when the page opens. */
export const INITIAL_VIEW = {
  lat: 51.0,
  lon: 1.45,
  zoom: 10,
} as const;

/** The OpenStreetMap Standard layer. */
export const TILE_LAYER = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors",
} as const;

/**
 * Source label on the panel. While the data is demo-only, this is the same
 * label used on the card — it comes from one place so the two never diverge.
 */
export const SOURCE_LABEL = formatSource("demo");

/** AISStream feed address. The key is not part of it — it goes in the subscription. */
export const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";

/**
 * Collection window: this many seconds from the start of server-side request
 * processing, including connecting and sending the subscription. The same
 * constant appears in the on-screen label, so it lives here rather than in
 * the collector module.
 */
export const SNAPSHOT_WINDOW_SECONDS = 15;

/**
 * Set limit: this many unique vessels with a valid position, and collection
 * ends immediately without waiting out the window. The customer needs a
 * sample of the area, not the whole strait. The number is also named in the
 * on-screen label ("stopped at the limit of 100"), so it sits next to the
 * window, in one place.
 */
export const SNAPSHOT_VESSEL_LIMIT = 100;

/**
 * Area subscription: AISStream expects a list of rectangles, each a pair of
 * `[latitude, longitude]` corners. There is one area, hence the three levels
 * of nesting.
 */
export const SUBSCRIPTION_BOUNDING_BOXES = [
  [
    [AREA_BOUNDS.south, AREA_BOUNDS.west],
    [AREA_BOUNDS.north, AREA_BOUNDS.east],
  ],
] as const;

/** A route point: only coordinates — time and course are derived from it. */
export type RoutePoint = {
  readonly lat: number;
  readonly lon: number;
};

/**
 * A demo vessel: a route given as a fixed sequence of points, plus its speed.
 * Points are literals, not computed — the route must be identical on every
 * run of the session.
 */
export type DemoRoute = {
  readonly id: string;
  readonly name: string;
  readonly speedKnots: number;
  readonly route: readonly RoutePoint[];
};

/** Demo step: vessels advance to the next point this often, in milliseconds. */
export const DEMO_TICK_MS = 2000;

/**
 * Message time before the first tick. A literal, not the current time: the
 * page is prerendered at build time, and `new Date()` in the render body
 * would give the server and the browser different text — a hydration
 * mismatch. The real timer-start time is set in an effect, i.e. already in
 * the browser.
 */
export const DEMO_START_TIME = "2026-09-10T12:00:00Z";

/**
 * Three demo vessels. Routes are spread across the strait so they don't
 * overlap on the projector: demo-1 heads down the strait to the southwest,
 * demo-2 heads toward it to the northeast, demo-3 crosses the strait from
 * northwest to southeast, like a ferry.
 *
 * All points lie inside AREA_BOUNDS.
 */
export const DEMO_ROUTES: readonly DemoRoute[] = [
  {
    id: "demo-1",
    name: "Demo vessel 1",
    speedKnots: 12.3,
    route: [
      // The first route point matches the map's initial center, so the vessel is visible on load.
      { lat: 51.0, lon: 1.45 },
      { lat: 50.98, lon: 1.4 },
      { lat: 50.96, lon: 1.35 },
      { lat: 50.94, lon: 1.3 },
      { lat: 50.93, lon: 1.25 },
      { lat: 50.91, lon: 1.2 },
      { lat: 50.89, lon: 1.15 },
      { lat: 50.88, lon: 1.1 },
      { lat: 50.86, lon: 1.05 },
      { lat: 50.85, lon: 1.0 },
    ],
  },
  {
    id: "demo-2",
    name: "Demo vessel 2",
    speedKnots: 9.6,
    route: [
      { lat: 50.8, lon: 1.25 },
      { lat: 50.83, lon: 1.32 },
      { lat: 50.86, lon: 1.39 },
      { lat: 50.9, lon: 1.46 },
      { lat: 50.93, lon: 1.53 },
      { lat: 50.97, lon: 1.6 },
      { lat: 51.0, lon: 1.67 },
      { lat: 51.04, lon: 1.74 },
      { lat: 51.08, lon: 1.81 },
    ],
  },
  {
    id: "demo-3",
    name: "Demo vessel 3",
    speedKnots: 18.5,
    route: [
      { lat: 51.12, lon: 1.32 },
      { lat: 51.11, lon: 1.4 },
      { lat: 51.1, lon: 1.48 },
      { lat: 51.08, lon: 1.56 },
      { lat: 51.06, lon: 1.64 },
      { lat: 51.03, lon: 1.71 },
      { lat: 51.0, lon: 1.78 },
      { lat: 50.97, lon: 1.85 },
    ],
  },
];
