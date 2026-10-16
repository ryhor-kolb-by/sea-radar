# Sample Provenance

File: `position-report.sample.json`

## Time of retrieval

`2026-09-17T17:32:05.720Z` — when the server accepted the message (`collectedAt` from the `/api/snapshot` response).

The message’s own timestamp — `MetaData.time_utc` = `2026-09-17 17:32:03.718165747 +0000 UTC` — is about 2 seconds earlier: this is the source timestamp, not the time we received it.

## Subscription area

Dover Strait, `AREA_BOUNDS` from `src/config.ts`: from 50.75° N, 0.95° E to 51.25° N, 1.95° E.

The subscription was sent as `BoundingBoxes: [[[50.75, 0.95], [51.25, 1.95]]]` with the filter `FilterMessageTypes: ['PositionReport']`.

The sample position — 51.03991° N, 1.40933° E — is inside this rectangle (checked against the boundaries).

## Received from a live source

**Yes.** The message arrived over WebSocket from `wss://stream.aisstream.io/v0/stream` in response to a `GET /api/snapshot` request; HTTP 200, `raw` was non-empty. The file was written programmatically from the response’s `raw` field without manual retyping: only indentation was added; key order and values were not changed.

Key caveat: that same morning, the same request returned `disconnected` — the source closed the connection immediately after subscription. By the time the sample was retrieved, the key was working. The application cannot observe what exactly changed.

The vessel is real (MMSI 538002013, “BERN”); the data is public — AIS broadcasts it over the open airwaves.

## Differences from AISStream documentation

1. **Coordinate capitalization differs between levels.** In `MetaData` they are lowercase `latitude` / `longitude`; in `Message.PositionReport` they are uppercase `Latitude` / `Longitude`. The documentation page shows `MetaData.Latitude` uppercase in one place; the sample confirms lowercase, as in the AsyncAPI schema. For the converter (B-11), the coordinate source is `Message.PositionReport`, where capitalization is uppercase.

2. **Coordinates at the two levels do not have the same precision.** `MetaData.latitude` = 51.03991 (5 digits), `PositionReport.Latitude` = 51.03990833333333 (full precision). This is the same position rounded differently. SPRINT-02 takes coordinates from `Message.PositionReport` — the value there is unrounded.

3. **`time_utc` is not ISO 8601.** Format `2026-09-17 17:32:03.718165747 +0000 UTC` is the standard Go rendering of `time.Time`: a space instead of `T`, suffix ` +0000 UTC` instead of `Z`. `new Date(...)` does not parse this string. This sample has **9 fractional digits**; the documentation example has 6: the fractional-part length is not fixed, so parsing with a rigid template will fail on another message.

4. **There is an `MMSI_String` field absent from the documentation example.** Contrary to its name, it arrives as a **number** (`538002013`), not a string — matching `MMSI`. It is also described as an integer in the schema. `MetaData.MMSI` is used for `id`, as specified in the task.

5. **`ShipName` is padded with spaces to 20 characters** — `"BERN                "`. Trimming the ends, as required by SPRINT-02, is necessary: otherwise the name in the card will have trailing spaces.

6. **`Sog` arrived as an integer** (`8`, not `8.0`) — this is the same number in JSON, but the difference is noticeable when comparing with documentation examples where speed is fractional. The type is number in both cases.

7. **The `Timestamp` field inside `PositionReport`** (here `58`) is the AIS timestamp second, not the message time. The message time is `MetaData.time_utc`; they must not be confused.

8. **Subscription confirmation.** SPRINT-02 says the source does not send it; the documentation says it does (`SubscriptionConfirmation`, without `MetaData`). The reader skips all frames whose `MessageType` is not `PositionReport`, so a service frame could not have appeared in the sample. The discrepancy between the task and documentation remains an open question.
