/**
 * Snapshot error codes and their text. The text is part of the contract with
 * the interface: the interface shows `message` as-is, so the wording is set
 * here as literals and isn't repeated anywhere else.
 *
 * The raw text of a provider error or an exception never ends up in
 * `message`: only one of these five strings goes out. Otherwise an internal
 * detail could leak into the response, up to a key embedded in a URL.
 */

export type SnapshotErrorCode =
  | "no_api_key"
  | "connect_failed"
  | "provider_error"
  | "disconnected"
  | "internal";

const MESSAGES: Record<SnapshotErrorCode, string> = {
  no_api_key: "AISStream key is not configured",
  connect_failed: "Unable to connect to the data source",
  provider_error: "The data source returned an error",
  disconnected: "Connection to the data source was lost",
  internal: "Internal server error",
};

export function messageFor(code: SnapshotErrorCode): string {
  return MESSAGES[code];
}
