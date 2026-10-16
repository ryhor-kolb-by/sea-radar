/**
 * Demo vessels: assembling a vessel structure from the configuration's
 * routes. Routes aren't computed or extended here — points are used exactly
 * as written, as literals, in config.ts.
 */

import type { DemoRoute, RoutePoint } from "@/config";
import { DEMO_ROUTES, DEMO_START_TIME } from "@/config";
import type { Vessel } from "@/vessel";
import { toVesselName } from "@/vessel";

const DEG = Math.PI / 180;

/**
 * The initial bearing of a great-circle segment: the course a vessel leaves
 * point `from` on to arrive at `to`. Along a great circle the course changes
 * over the segment, so "initial" isn't a qualifier — it's part of the
 * definition.
 *
 * The result is normalized to [0, 360): that's exactly the range the
 * `courseDeg` field promises, while atan2 returns a value in [-180, 180].
 */
export function bearingDeg(from: RoutePoint, to: RoutePoint): number {
  const fromLat = from.lat * DEG;
  const toLat = to.lat * DEG;
  const deltaLon = (to.lon - from.lon) * DEG;

  const y = Math.sin(deltaLon) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLon);

  const degrees = Math.atan2(y, x) / DEG;
  return (degrees + 360) % 360;
}

/**
 * A vessel at point `index` of its route.
 *
 * Course is the bearing of the segment the vessel arrived on: at the start
 * of the route there is no such segment yet, so the direction to the next
 * point is used; afterward it's from the previous point to the current one.
 * At the final point, course therefore keeps its last value automatically.
 *
 * Speed at the final point is `0`: the vessel has arrived and is stationary.
 * It's specifically zero, not `null` — the value is known, and the card will
 * show "0 kn," not "No data."
 */
function vesselAt(demo: DemoRoute, index: number, timestamp: string): Vessel {
  const last = demo.route.length - 1;
  const point = demo.route[index];
  const arrived = index === last;

  const courseDeg =
    index === 0
      ? bearingDeg(point, demo.route[1])
      : bearingDeg(demo.route[index - 1], point);

  return {
    id: demo.id,
    name: toVesselName(demo.name),
    lat: point.lat,
    lon: point.lon,
    speedKnots: arrived ? 0 : demo.speedKnots,
    courseDeg,
    timestamp,
    source: "demo",
  };
}

/**
 * Demo state: the step number and the vessels at that step. Vessels are
 * stored alongside the step rather than recomputed on every render, so that
 * an arrived vessel can be returned by the same reference — see `stepDemo`.
 */
export type DemoState = {
  readonly step: number;
  readonly vessels: readonly Vessel[];
};

/** The step at which the last vessel reaches its final point. */
const LAST_STEP = Math.max(...DEMO_ROUTES.map((demo) => demo.route.length - 1));

/** The start of the demo: all vessels at the first point of their route. */
export function demoStart(timestamp: string = DEMO_START_TIME): DemoState {
  return {
    step: 0,
    vessels: DEMO_ROUTES.map((demo) => vesselAt(demo, 0, timestamp)),
  };
}

/**
 * The next demo step. The time is the moment of this tick, the same for all
 * vessels.
 *
 * A vessel that has already reached its final point is returned by the same
 * reference: "the vessel no longer changes" applies to its message time too.
 * Otherwise a stationary vessel's `timestamp` would tick every two seconds
 * even though no new message about it ever appeared. Routes have different
 * lengths, so vessels arrive on different ticks, and each one freezes on its
 * own.
 *
 * Once all have arrived, the previous state is returned in full, by the same
 * reference: React compares state by reference and simply won't re-render,
 * so further ticks become no-ops.
 */
export function stepDemo(current: DemoState, timestamp: string): DemoState {
  if (current.step >= LAST_STEP) {
    return current;
  }

  const step = current.step + 1;

  return {
    step,
    vessels: DEMO_ROUTES.map((demo, i) => {
      const last = demo.route.length - 1;
      // The vessel was already at its final point before this tick — leave
      // it alone. The tick it arrives on (step === last) goes through the
      // normal path — that's exactly when speed becomes zero.
      if (current.step >= last) {
        return current.vessels[i];
      }

      return vesselAt(demo, Math.min(step, last), timestamp);
    }),
  };
}
