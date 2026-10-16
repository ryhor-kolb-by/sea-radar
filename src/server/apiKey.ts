/**
 * Reads the AISStream key. This module is server-only: it reads `process.env`
 * and must never end up in the client bundle. Next.js doesn't expose a variable
 * name without the `NEXT_PUBLIC_` prefix to the browser, but relying on that
 * alone isn't enough, so the module is imported only from route code.
 *
 * The key value is exposed to exactly one place — sending the subscription. It
 * is never logged, never included in a response, and never interpolated into
 * error messages.
 */

/** Missing key is a normal outcome, not an exception: the route handles it. */
export type ApiKeyResult =
  | { readonly ok: true; readonly key: string }
  | { readonly ok: false };

/**
 * Key from the environment. An empty string or a string of only whitespace is
 * not a key but its absence: `.env.example` contains `AISSTREAM_API_KEY=` with
 * no value, and that file must not look like a configured key.
 */
export function readApiKey(): ApiKeyResult {
  const raw = process.env.AISSTREAM_API_KEY;

  if (raw === undefined || raw.trim() === "") {
    return { ok: false };
  }

  return { ok: true, key: raw.trim() };
}
