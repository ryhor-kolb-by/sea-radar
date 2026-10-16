/**
 * `GET /api/snapshot` — a snapshot of real positions.
 *
 * Returns the set of vessels collected over the collection window. An empty
 * set is a success with `vessels: []`, not an error: there may simply have
 * been no vessels in the area, and the interface says so in separate words.
 *
 * The handler is server-side: the key is read here and never reaches the
 * browser. The connection to AISStream is opened by the application server,
 * not the page.
 */

import { SNAPSHOT_WINDOW_SECONDS } from "@/config";
import { readApiKey } from "@/server/apiKey";
import {
  collectSnapshot,
  createWebSocketTransport,
  systemClock,
} from "@/server/reader";
import type { SnapshotErrorCode } from "@/server/snapshotError";
import { messageFor } from "@/server/snapshotError";

// Node runtime: WebSocket and a server environment are needed. In Next.js 16
// this is already the default, and Edge is deprecated — the line is kept
// explicit because the task calls it part of the contract.
export const runtime = "nodejs";

// The snapshot depends on the moment of the request: the response is not cached or prerendered.
export const dynamic = "force-dynamic";

function errorResponse(code: SnapshotErrorCode, attemptedAt: Date): Response {
  return Response.json(
    {
      ok: false,
      attemptedAt: attemptedAt.toISOString(),
      error: { code, message: messageFor(code) },
    },
    { status: 502 },
  );
}

export async function GET(request: Request): Promise<Response> {
  // No key — respond right away, no connection is opened at all.
  const apiKey = readApiKey();
  if (!apiKey.ok) {
    return errorResponse("no_api_key", systemClock.now());
  }

  try {
    const result = await collectSnapshot({
      apiKey: apiKey.key,
      transport: createWebSocketTransport(),
      clock: systemClock,
      signal: request.signal,
    });

    if (!result.ok) {
      return errorResponse(result.code, result.attemptedAt);
    }

    return Response.json({
      ok: true,
      vessels: result.vessels,
      collectedAt: result.collectedAt.toISOString(),
      // The window constant, not the actual duration: when collection ends
      // at the limit it took less time, but the on-screen label still
      // states the same 15 s.
      windowSeconds: SNAPSHOT_WINDOW_SECONDS,
      count: result.vessels.length,
      truncated: result.truncated,
      reason: result.reason,
    });
  } catch {
    // The exception's text is never exposed: it could contain anything, up
    // to the key embedded in a URL. What goes out is a fixed phrase.
    return errorResponse("internal", systemClock.now());
  }
}
