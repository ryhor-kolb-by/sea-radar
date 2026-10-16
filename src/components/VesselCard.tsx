import type { Vessel } from "@/vessel";
import {
  formatCourse,
  formatName,
  formatPosition,
  formatSource,
  formatSpeed,
  formatTimestamp,
} from "@/vessel";

/**
 * Card for the selected vessel. There is no close button: the card closes
 * only by selecting another vessel.
 *
 * All values are inserted as React text nodes. The name comes from the crew
 * and may contain markup — React escapes it, so `<b>Demo</b>` is shown as
 * characters, not bold text.
 */
export default function VesselCard({ vessel }: { vessel: Vessel }) {
  const rows = [
    { label: "Identifier", value: vessel.id },
    { label: "Name", value: formatName(vessel.name) },
    { label: "Coordinates", value: formatPosition(vessel.lat, vessel.lon) },
    { label: "Speed", value: formatSpeed(vessel.speedKnots) },
    { label: "Course", value: formatCourse(vessel.courseDeg) },
    { label: "Time", value: formatTimestamp(vessel.timestamp) },
    { label: "Source", value: formatSource(vessel.source) },
  ];

  return (
    <section className="card" data-card-vessel-id={vessel.id}>
      <dl className="card-rows">
        {rows.map((row) => (
          <div className="card-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
