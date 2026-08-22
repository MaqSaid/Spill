/**
 * Session Service — Ephemeral anonymous tracking using sessionStorage.
 *
 * Privacy guarantees:
 * - Token is stored ONLY in sessionStorage (destroyed on tab close).
 * - Only SHA-256(token) is ever sent to the server.
 * - Token is 128-bit random (crypto.getRandomValues).
 * - No localStorage, cookies, or persistent identifiers.
 */

const SESSION_TOKEN_KEY = "spill_receipt_token";

/**
 * Get or generate the ephemeral session receipt token.
 * Stored in sessionStorage only — lost when the tab closes.
 */
export function getSessionToken(): string {
  const existing = sessionStorage.getItem(SESSION_TOKEN_KEY);
  if (existing) {
    return existing;
  }

  // Generate 128-bit (16 byte) random token as hex
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  const token = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  return token;
}

/**
 * Compute SHA-256 hash of the session token.
 * This is the only value sent to the server — the actual token stays local.
 */
export async function getReceiptHash(): Promise<string> {
  const token = getSessionToken();
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Check if a session token exists (user has submitted in this session).
 */
export function hasSessionToken(): boolean {
  return sessionStorage.getItem(SESSION_TOKEN_KEY) !== null;
}
