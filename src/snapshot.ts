/**
 * Browser-side snapshot: the shape of the `/api/snapshot` response, parsing
 * the response, and the panel's text.
 *
 * The text is part of the contract with the customer and with future tests,
 * so it's collected here as literals and not repeated in markup. The numbers
 * in the label (15 s, limit 100) come from the response and from
 * configuration, not typed into the string by hand — otherwise the label
 * would lie after the constant changed.
 *
 * The key never ends up here and cannot: this module only knows the response
 * body, and the key isn't in it.
 */

import { SNAPSHOT_VESSEL_LIMIT } from "@/config";
import { messageFor } from "@/server/snapshotError";
import type { Vessel } from "@/vessel";
import { formatSource, formatTimestamp } from "@/vessel";

/**
 * The route's response body. Success and error are distinguished by the `ok`
 * field, the same way the server distinguishes them.
 */
export type SnapshotResponse =
  | {
      readonly ok: true;
      readonly vessels: readonly Vessel[];
      readonly collectedAt: string;
      readonly windowSeconds: number;
      readonly count: number;
      readonly truncated: boolean;
      readonly reason: "window_elapsed" | "limit_reached";
    }
  | {
      readonly ok: false;
      readonly attemptedAt: string;
      readonly error: { readonly code: string; readonly message: string };
    };

/**
 * What the screen shows. An empty response isn't a separate state: it's the
 * same success with zero vessels, with the same label — only the message
 * beneath it differs. Splitting them into two states would mean duplicating
 * label assembly.
 */
export type Screen =
  | { readonly kind: "idle-demo" }
  | { readonly kind: "loading" }
  | { readonly kind: "loaded"; readonly snapshot: Extract<SnapshotResponse, { ok: true }> }
  | { readonly kind: "error"; readonly message: string };

/** Message under the label when no vessel arrived during the collection window. */
const EMPTY_MESSAGE = "No positions were received during collection";

/** Start of the error message; the text from the response body follows. */
const ERROR_PREFIX = "Unable to retrieve data: ";

/** Source label when the map has no vessels because of an error. */
const ERROR_LABEL = "No vessel data on the map";

/** Source label while collection is in progress. */
const LOADING_LABEL = "Loading…";

/** The button's text. */
export const LOAD_BUTTON_TEXT = "Load live positions";

/**
 * Source label for a loaded snapshot.
 *
 * "Incomplete sample" is always present, not only when collection is cut off
 * by the limit: in fifteen seconds, only vessels that managed to send a
 * position make it into the snapshot — that's never all the vessels in the
 * area, whatever the outcome. A separate note about the limit is appended
 * when collection stopped at a hundred.
 */
export function snapshotLabel(
  snapshot: Extract<SnapshotResponse, { ok: true }>,
): string {
  const base =
    `${formatSource("aisstream")} · snapshot over ${snapshot.windowSeconds} s` +
    ` · received ${formatTimestamp(snapshot.collectedAt)}` +
    ` · vessels: ${snapshot.count} · incomplete sample`;

  return snapshot.truncated
    ? `${base} · stopped at limit ${SNAPSHOT_VESSEL_LIMIT}`
    : base;
}

/** Source label for any screen state. */
export function screenLabel(screen: Screen, demoLabel: string): string {
  switch (screen.kind) {
    case "idle-demo":
      return demoLabel;
    case "loading":
      return LOADING_LABEL;
    case "loaded":
      return snapshotLabel(screen.snapshot);
    case "error":
      return ERROR_LABEL;
  }
}

/**
 * The message under the label, if any. The demo and a non-empty snapshot
 * have none — the label itself says it all.
 */
export function screenMessage(screen: Screen): string | null {
  if (screen.kind === "error") {
    return `${ERROR_PREFIX}${screen.message}`;
  }

  if (screen.kind === "loaded" && screen.snapshot.count === 0) {
    return EMPTY_MESSAGE;
  }

  return null;
}

/**
 * Route response → screen state.
 *
 * An error response shows the `message` from the body: the server chooses
 * the wording, the interface doesn't compose or embellish it. A body without
 * `ok` is a case our contract doesn't have; it's treated as an internal
 * error, not as an empty success, so a broken response doesn't look like "no
 * vessels."
 */
export function toScreen(body: unknown): Screen {
  if (typeof body !== "object" || body === null || !("ok" in body)) {
    return { kind: "error", message: messageFor("internal") };
  }

  const response = body as SnapshotResponse;

  return response.ok
    ? { kind: "loaded", snapshot: response }
    : { kind: "error", message: response.error.message };
}

/** Vessels shown by the map. In every state except a loaded snapshot, there are none. */
export function screenVessels(screen: Screen): readonly Vessel[] {
  return screen.kind === "loaded" ? screen.snapshot.vessels : [];
}
