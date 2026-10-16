"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { DEMO_TICK_MS, SOURCE_LABEL } from "@/config";
import { demoStart, stepDemo } from "@/demo";
import type { Screen } from "@/snapshot";
import {
  LOAD_BUTTON_TEXT,
  screenLabel,
  screenMessage,
  screenVessels,
  toScreen,
} from "@/snapshot";
import VesselCard from "@/components/VesselCard";

/**
 * The Sea Radar screen. The map is loaded with ssr: false — otherwise
 * Leaflet would run during server rendering and crash on accessing window.
 */
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
});

export default function RadarView() {
  /**
   * The selection is stored as an id, not a vessel object: the map and the
   * card read the vessel from the same place, so they can't diverge.
   */
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /**
   * Demo state. The initializer is a function: otherwise demoStart() would
   * run on every render, not only the first. The start time here is a
   * literal; the real one is set in the effect below, already in the
   * browser.
   */
  const [demo, setDemo] = useState(demoStart);

  /**
   * What's currently shown. One state for the whole screen, rather than a
   * set of flags like "loading," "had an error," "has data": the last two
   * could end up true at the same time, and the screen would show both
   * vessels and an error. What's shown is always the result of the last
   * attempt, and nothing else.
   */
  const [screen, setScreen] = useState<Screen>({ kind: "idle-demo" });

  /**
   * Counter for resetting the map to its initial view. It only increments on
   * the first non-empty success: the customer asked to show arrived vessels,
   * but didn't want the map to jump on every subsequent load.
   */
  const [viewResetKey, setViewResetKey] = useState(0);

  /** The first non-empty success has already happened — don't touch the map view further. */
  const centeredRef = useRef(false);

  // The demo runs until a load result replaces it. The flag is read by the
  // timer effect, so it lives in a ref: it shouldn't cause the effect itself
  // to restart.
  const demoRunningRef = useRef(true);
  demoRunningRef.current = screen.kind === "idle-demo";

  useEffect(() => {
    // The moment the timer starts is the message time at the starting point.
    // Set here, not in the render body: the server has a different time, and
    // the markup wouldn't match during hydration.
    setDemo(demoStart(new Date().toISOString()));

    // One timer for all vessels: the tick is shared, and all vessels are
    // recalculated together within a step. There's no per-vessel timer —
    // otherwise vessels would drift apart in time.
    const timer = setInterval(() => {
      // After the button is clicked, the demo is stopped: the tick becomes a
      // no-op. This timer never moves real vessels at all — it only knows
      // about the demo.
      if (!demoRunningRef.current) {
        return;
      }

      // Time is taken at the moment of the tick, not in advance, and passed
      // into the step — stepDemo stays a pure function with no clock access.
      const now = new Date().toISOString();
      setDemo((current) => stepDemo(current, now));
    }, DEMO_TICK_MS);

    // Clear the timer when leaving the page and before the effect reruns. In
    // development React invokes the effect twice — without this line there
    // would be two intervals, and vessels would move twice as fast.
    return () => {
      clearInterval(timer);
    };
  }, []);

  // Clicking the already-selected vessel again doesn't change the selection.
  // This falls out naturally here: the same id gives the same state, and
  // React doesn't re-render the card.
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  /**
   * Loading a snapshot. The button is disabled for the whole request, so a
   * second simultaneous load can't happen, and with it, no race between two
   * responses.
   *
   * The previous attempt's set isn't kept on either error or an empty
   * response: the state is replaced entirely, and the map ends up showing
   * exactly this attempt's result. Showing the previous load's vessels next
   * to an error message would pass off old positions as current.
   */
  const handleLoad = useCallback(async () => {
    // The demo is cleared immediately, before the response: vessels,
    // selection, and the card leave the screen the moment the button is
    // clicked, not after the server responds.
    setScreen({ kind: "loading" });
    setSelectedId(null);

    try {
      const response = await fetch("/api/snapshot");
      const body: unknown = await response.json();
      const next = toScreen(body);

      setScreen(next);

      // Reset to the initial view only on the first non-empty success.
      if (
        next.kind === "loaded" &&
        next.snapshot.count > 0 &&
        !centeredRef.current
      ) {
        centeredRef.current = true;
        setViewResetKey((key) => key + 1);
      }
    } catch {
      // There's no response at all — a network or body-parsing failure. The
      // server has no text to offer in this case, so the same phrase it
      // uses for an internal error is used here: on screen it's equally
      // "the attempt failed."
      setScreen(toScreen(null));
    }
  }, []);

  // Vessels on the map: demo ones until there's been any attempt, after that
  // only the latest set. While loading, on error, and on an empty response
  // it's empty.
  const vessels =
    screen.kind === "idle-demo" ? demo.vessels : screenVessels(screen);

  // The card is shown only for a vessel from the current set. No separate
  // reset of the card is needed: an empty set means there's nothing to find,
  // so there's no card.
  const selected =
    vessels.find((vessel) => vessel.id === selectedId) ?? null;

  const message = screenMessage(screen);

  return (
    <div className="radar">
      <LeafletMap
        vessels={vessels}
        onSelect={handleSelect}
        viewResetKey={viewResetKey}
      />
      {/* Panel order: load button, source label, notice, then vessel card. */}
      <aside className="panel">
        <button
          type="button"
          className="load-button"
          onClick={handleLoad}
          disabled={screen.kind === "loading"}
        >
          {LOAD_BUTTON_TEXT}
        </button>
        <p className="source">{screenLabel(screen, SOURCE_LABEL)}</p>
        {message !== null && <p className="notice">{message}</p>}
        {selected !== null && <VesselCard vessel={selected} />}
      </aside>
    </div>
  );
}
