"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { AREA_BOUNDS, INITIAL_VIEW, TILE_LAYER } from "@/config";
import type { Vessel } from "@/vessel";

const ICON_SIZE = 24;

/**
 * A vessel's icon. With a course, it's a triangle rotated to that course: 0°
 * points north, measured clockwise, like a bearing. Without a course, it's a
 * neutral circle: there's nothing to rotate by, and the look must say so.
 *
 * The markup is assembled from literals; crew data (the name) never ends up
 * here, so the HTML string is safe.
 */
function vesselIcon(vessel: Vessel) {
  const hasCourse = vessel.courseDeg !== null;
  const shape = hasCourse
    ? `<svg viewBox="0 0 24 24" width="${ICON_SIZE}" height="${ICON_SIZE}" style="transform: rotate(${vessel.courseDeg}deg)"><path d="M12 2 L20 22 L12 17 L4 22 Z" fill="#1d4ed8" stroke="#ffffff" stroke-width="1.5" /></svg>`
    : `<svg viewBox="0 0 24 24" width="${ICON_SIZE}" height="${ICON_SIZE}"><circle cx="12" cy="12" r="8" fill="#64748b" stroke="#ffffff" stroke-width="1.5" /></svg>`;

  return L.divIcon({
    className: "",
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
    html:
      `<div class="vessel-icon" data-vessel-id="${vessel.id}"` +
      ` data-icon="${hasCourse ? "course" : "neutral"}">${shape}</div>`,
  });
}

/**
 * The area map. This module loads only in the browser: Leaflet touches
 * window on import, so it must never run on the server.
 */
export default function LeafletMap({
  vessels,
  onSelect,
  viewResetKey,
}: {
  vessels: readonly Vessel[];
  onSelect: (id: string) => void;
  /**
   * Counter for returns to the initial view. When it changes, the map
   * returns to INITIAL_VIEW. It's a number, not a flag: a "reset the view"
   * flag would have to be cleared back, whereas a counter shows the event
   * itself, not a state. A value of 0 on the first render does nothing — the
   * view is already the initial one when the map is created.
   */
  viewResetKey: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // The handler is read via a ref: otherwise a new function on every render
  // would land in the effect's dependencies and the map would be recreated
  // on every selection.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // The map and markers survive renders: the map is created once, and
  // markers afterward are moved by id. Without this, every tick would
  // recreate the map.
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }

    const map = L.map(container, {
      center: [INITIAL_VIEW.lat, INITIAL_VIEW.lon],
      zoom: INITIAL_VIEW.zoom,
      maxBounds: L.latLngBounds(
        [AREA_BOUNDS.south, AREA_BOUNDS.west],
        [AREA_BOUNDS.north, AREA_BOUNDS.east],
      ),
    });

    L.tileLayer(TILE_LAYER.url, {
      attribution: TILE_LAYER.attribution,
    }).addTo(map);

    mapRef.current = map;

    // Clicking the map away from any vessel doesn't change the selection, so
    // there's no map click handler at all. Leaflet itself doesn't clear a
    // selection — there's nothing for it to clear.

    // In development, React invokes the effect twice. Without tearing down
    // the map, the second call fails with "Map container is already
    // initialized."
    return () => {
      map.remove();
      mapRef.current = null;
      // The markers belonged to the removed map: references to them are no
      // longer valid, otherwise the next pass would move icons on a deleted
      // map.
      markersRef.current.clear();
    };
  }, []);

  /**
   * Vessel positions and icons. A separate effect: the map is created once,
   * while this pass runs on every tick. Markers aren't recreated — the
   * existing one is moved, otherwise icons would flicker on the map and the
   * handler would be lost.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (map === null) {
      return;
    }

    const markers = markersRef.current;

    // Vessels absent from the new set are removed from the map. The demo
    // always returned the same three vessels, and before loading existed
    // there was nothing to remove; now the set changes entirely — on
    // loading, on error, and on an empty response, no icons from the
    // previous screen should remain on the map.
    //
    // A vessel disappearing from the set only means it didn't make it into
    // this snapshot: fifteen seconds isn't the entire traffic of the area.
    // It doesn't mean "the vessel left."
    const present = new Set(vessels.map((vessel) => vessel.id));
    for (const [id, marker] of markers) {
      if (!present.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    }

    for (const vessel of vessels) {
      const existing = markers.get(vessel.id);

      if (existing === undefined) {
        const marker = L.marker([vessel.lat, vessel.lon], {
          icon: vesselIcon(vessel),
        }).addTo(map);

        // The handler is attached once per marker and reads the id from the
        // closure: the vessel's id doesn't change, only its coordinates and
        // course do.
        marker.on("click", () => {
          onSelectRef.current(vessel.id);
        });

        markers.set(vessel.id, marker);
        continue;
      }

      existing.setLatLng([vessel.lat, vessel.lon]);
      // The icon is rebuilt entirely: along with the rotation it carries
      // data-vessel-id and data-icon, and after a step they must still be
      // correct.
      existing.setIcon(vesselIcon(vessel));
    }
  }, [vessels]);

  /**
   * Resetting to the initial view. A separate effect with a separate
   * dependency: the view is touched only when the counter changes, not on
   * every new set — otherwise a second load would reset a map the person
   * had just panned.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (map === null || viewResetKey === 0) {
      return;
    }

    map.setView([INITIAL_VIEW.lat, INITIAL_VIEW.lon], INITIAL_VIEW.zoom);
  }, [viewResetKey]);

  return <div ref={containerRef} className="map" />;
}
