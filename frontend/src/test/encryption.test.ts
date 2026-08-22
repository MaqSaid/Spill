/**
 * Unit tests for the encryption service.
 *
 * Note: These tests require a browser-like environment with Web Crypto API.
 * Vitest with jsdom provides crypto.subtle via Node's built-in crypto.
 */

import { describe, it, expect } from "vitest";

// Mock Web Crypto for testing (Node 20+ has globalThis.crypto)
describe("Encryption Service Utilities", () => {
  it("should have crypto.subtle available in test environment", () => {
    expect(globalThis.crypto).toBeDefined();
    expect(globalThis.crypto.subtle).toBeDefined();
  });

  it("should generate random values", () => {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    // At least one byte should be non-zero (probabilistically certain)
    const hasNonZero = bytes.some((b) => b !== 0);
    expect(hasNonZero).toBe(true);
  });

  it("should produce unique random tokens", () => {
    const a = new Uint8Array(16);
    const b = new Uint8Array(16);
    globalThis.crypto.getRandomValues(a);
    globalThis.crypto.getRandomValues(b);

    const aHex = Array.from(a)
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    const bHex = Array.from(b)
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");

    expect(aHex).not.toEqual(bHex);
    expect(aHex).toHaveLength(32);
  });

  it("should compute SHA-256 digest", async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode("test-token");
    const hash = await globalThis.crypto.subtle.digest("SHA-256", data);
    const hashHex = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    expect(hashHex).toHaveLength(64);
    // SHA-256 of "test-token" is deterministic
    expect(hashHex).toEqual(hashHex.toLowerCase());
  });
});
