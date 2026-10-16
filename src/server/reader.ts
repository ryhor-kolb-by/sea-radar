/**
 * Collects a position snapshot from AISStream.
 *
 * The module contains no network code and calls no clock: the connection and
 * time arrive as parameters. Because of that, the collector can be tested
 * with prepared messages and controlled time, without opening a socket or
 * having a key.
 *
 * Field parsing is out of scope here — `toVessel` turns a message into a
 * vessel. This module only accumulates the set and applies the completion
 * rules.
 */

import {
  AISSTREAM_URL,
  SNAPSHOT_VESSEL_LIMIT,
  SNAPSHOT_WINDOW_SECONDS,
  SUBSCRIPTION_BOUNDING_BOXES,
} from "@/config";
import type { SnapshotErrorCode } from "@/server/snapshotError";
import { toVessel } from "@/server/toVessel";
import type { Vessel } from "@/vessel";

/**
 * The connection to the source — exactly what the collector uses. The
 * production implementation wraps a WebSocket; the test one just calls the
 * handlers.
 */
export type Transport = {
  readonly send: (payload: string) => void;
  readonly close: () => void;
  readonly onOpen: (handler: () => void) => void;
  /** The message arrives as a string: decoding the frame is the implementation's job. */
  readonly onMessage: (handler: (data: string) => void) => void;
  readonly onError: (handler: () => void) => void;
  readonly onClose: (handler: () => void) => void;
};

/** The clock: a time reading and a deadline timer. */
export type Clock = {
  readonly now: () => Date;
  readonly setTimer: (ms: number, callback: () => void) => unknown;
  readonly clearTimer: (handle: unknown) => void;
};

/**
 * Why collection ended. Both values are a success: the window elapsed with a
 * live connection, or the limit was reached. Unsuccessful outcomes don't end
 * up here — they have an error code.
 */
export type CollectReason = "window_elapsed" | "limit_reached";

/** The collection outcome: a set of vessels, or an error code. */
export type CollectResult =
  | {
      readonly ok: true;
      readonly vessels: readonly Vessel[];
      readonly collectedAt: Date;
      readonly reason: CollectReason;
      /** The set was cut off by the limit: there are vessels in the area not included here. */
      readonly truncated: boolean;
    }
  | { readonly ok: false; readonly code: SnapshotErrorCode; readonly attemptedAt: Date };

export type CollectOptions = {
  readonly apiKey: string;
  readonly transport: Transport;
  readonly clock: Clock;
  /** Client-side cancellation: ends collection via the same path as other outcomes. */
  readonly signal?: AbortSignal;
};

/** The area subscription. The key enters here and is copied nowhere else. */
function subscriptionPayload(apiKey: string): string {
  return JSON.stringify({
    APIKey: apiKey,
    BoundingBoxes: SUBSCRIPTION_BOUNDING_BOXES,
    FilterMessageTypes: ["PositionReport"],
  });
}

/**
 * A snapshot of positions over the collection window, or an error.
 *
 * The window is counted from entering the function, not from the connection
 * opening: per the task, the 15 seconds include both connecting and sending
 * the subscription.
 *
 * The set lives inside a single call and doesn't outlive it: nothing is
 * stored or accumulated between requests.
 */
export function collectSnapshot(options: CollectOptions): Promise<CollectResult> {
  const { apiKey, transport, clock, signal } = options;

  return new Promise<CollectResult>((resolve) => {
    // Connection state. `subscribed` separates "couldn't connect" from
    // "connected and then lost the connection": these are different error
    // codes in the task.
    let subscribed = false;

    // The result is delivered exactly once. Late events — a message after the
    // limit, a close after the window ends — no longer change anything.
    let settled = false;
    let timer: unknown = null;

    /**
     * The set: one position per vessel. The key is the `id` from MMSI, so a
     * hundred messages about one vessel produce one entry, and the limit
     * counts vessels, not messages.
     *
     * Next to the vessel sits its time in milliseconds — the same value as
     * `timestamp`, but as a number. It's stored rather than reparsed on every
     * comparison, since the comparison runs on every incoming message.
     */
    const byId = new Map<string, { vessel: Vessel; timeMs: number }>();

    /** Clears the timer and the connection for any finished or cancelled collection. */
    const cleanup = () => {
      if (timer !== null) {
        clock.clearTimer(timer);
        timer = null;
      }

      signal?.removeEventListener("abort", onAbort);

      // Closing the connection must not interfere with cleaning up an already-settled result.
      try {
        transport.close();
      } catch {
        // The source may have already dropped — that changes nothing about the result.
      }
    };

    /** The only path that settles the Promise with a finished collection outcome. */
    const finish = (result: CollectResult) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(result);
    };

    /**
     * Successful completion. The collected set is returned only from here:
     * an error or disconnection goes through `fail` and never returns a
     * partial set.
     */
    const succeed = (reason: CollectReason) => {
      finish({
        ok: true,
        vessels: [...byId.values()].map((entry) => entry.vessel),
        collectedAt: clock.now(),
        reason,
        truncated: reason === "limit_reached",
      });
    };

    const fail = (code: SnapshotErrorCode) => {
      finish({ ok: false, code, attemptedAt: clock.now() });
    };

    function onAbort() {
      // The client no longer needs a response: free resources, but don't settle the Promise.
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
    }

    if (signal !== undefined) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }

    // The deadline is set before connecting: time to connect counts toward the same 15 s.
    timer = clock.setTimer(SNAPSHOT_WINDOW_SECONDS * 1000, () => {
      // The connection opened and the subscription was sent — that's a
      // success even with zero vessels: there may have been none in the
      // area, and that's not an error.
      if (subscribed) {
        succeed("window_elapsed");
        return;
      }

      // The window ended and connecting never succeeded.
      fail("connect_failed");
    });

    transport.onOpen(() => {
      // The subscription is sent immediately after opening: AISStream gives
      // it a few seconds and closes the connection if it doesn't arrive.
      try {
        transport.send(subscriptionPayload(apiKey));
        subscribed = true;
      } catch {
        // Sending the subscription failed — so there effectively is no connection.
        fail("connect_failed");
      }
    });

    transport.onMessage((data) => {
      // A message after completion doesn't change the set. The check is here
      // too, not only in `finish`: otherwise a late frame could still get
      // written into `byId` between settling and the socket closing.
      if (settled) {
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        // The source sent something that isn't JSON — that's an error on its end.
        fail("provider_error");
        return;
      }

      // Service frames (subscription acknowledgment) and messages without a
      // valid vessel position don't create one: `toVessel` returns `null`,
      // and we simply keep waiting. That's not an error — the source is
      // allowed to send whatever it wants.
      const vessel = toVessel(parsed);
      if (vessel === null) {
        return;
      }

      // The message's own time, not arrival order: messages can arrive out
      // of the order in which they were composed. Precision is a
      // millisecond: `timestamp` was assembled by `toVessel` with
      // nanoseconds truncated, and parsing here is exact.
      const timeMs = Date.parse(vessel.timestamp);

      const known = byId.get(vessel.id);
      if (known !== undefined && timeMs <= known.timeMs) {
        // The mark isn't newer than the known one — the first-accepted one
        // stays. The strict ">" below is exactly this rule: at equal marks,
        // no replacement happens.
        return;
      }

      // A new message replaces the vessel entirely rather than patching
      // fields: otherwise the vessel would keep the speed and course from
      // its previous position.
      byId.set(vessel.id, { vessel, timeMs });

      // The limit is checked after writing and by vessel count: a hundred
      // messages about one vessel won't grow the size, and collection will
      // run to the end of the window.
      if (byId.size >= SNAPSHOT_VESSEL_LIMIT) {
        succeed("limit_reached");
      }
    });

    transport.onError(() => {
      // Before opening — "couldn't connect," and the response goes out
      // immediately, without waiting for the window to end. After — the
      // error is already on the source's side.
      fail(subscribed ? "provider_error" : "connect_failed");
    });

    transport.onClose(() => {
      // A close after subscribing means a lost connection; before
      // subscribing it means a failed connection attempt. What's been
      // collected by this point is not returned: a set from a cut-off
      // window is incomplete, and returning it as a success would
      // misrepresent the area.
      fail(subscribed ? "disconnected" : "connect_failed");
    });
  });
}

/** The production clock. */
export const systemClock: Clock = {
  now: () => new Date(),
  setTimer: (ms, callback) => setTimeout(callback, ms),
  clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * The production connection, built on WebSocket. In Node 22, `WebSocket` is
 * available globally, so no separate library is needed.
 */
export function createWebSocketTransport(): Transport {
  const socket = new WebSocket(AISSTREAM_URL);

  return {
    send: (payload) => socket.send(payload),
    close: () => socket.close(),
    onOpen: (handler) => socket.addEventListener("open", () => handler()),
    onMessage: (handler) => {
      socket.addEventListener("message", (event: MessageEvent) => {
        const { data } = event;

        // The source sends binary frames with UTF-8 JSON inside, but may
        // also send a string. A Blob is parsed asynchronously, so it's
        // handled separately.
        if (typeof data === "string") {
          handler(data);
          return;
        }

        if (data instanceof Blob) {
          void data.text().then(handler);
          return;
        }

        handler(new TextDecoder().decode(data as ArrayBuffer));
      });
    },
    onError: (handler) => socket.addEventListener("error", () => handler()),
    onClose: (handler) => socket.addEventListener("close", () => handler()),
  };
}
