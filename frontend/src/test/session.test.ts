/**
 * Session Service — Unit tests.
 *
 * Tests the ephemeral session token generation, storage, and hashing.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getSessionToken, getReceiptHash, hasSessionToken } from "../services/session";

describe("Session Service", () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  it("generates a 32-character hex token", () => {
    const token = getSessionToken();
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it("returns the same token within a session", () => {
    const token1 = getSessionToken();
    const token2 = getSessionToken();
    expect(token1).toBe(token2);
  });

  it("stores token in sessionStorage only", () => {
    getSessionToken();
    expect(sessionStorage.getItem("spill_receipt_token")).not.toBeNull();
    expect(localStorage.getItem("spill_receipt_token")).toBeNull();
  });

  it("hasSessionToken returns false before first call", () => {
    expect(hasSessionToken()).toBe(false);
  });

  it("hasSessionToken returns true after token generation", () => {
    getSessionToken();
    expect(hasSessionToken()).toBe(true);
  });

  it("generates unique tokens across sessions", () => {
    const token1 = getSessionToken();
    sessionStorage.clear();
    const token2 = getSessionToken();
    // Probabilistically unique (128-bit random)
    expect(token1).not.toBe(token2);
  });

  it("produces a 64-character hex receipt hash", async () => {
    const hash = await getReceiptHash();
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("receipt hash is deterministic for the same token", async () => {
    const hash1 = await getReceiptHash();
    const hash2 = await getReceiptHash();
    expect(hash1).toBe(hash2);
  });

  it("receipt hash differs from the token itself", async () => {
    const token = getSessionToken();
    const hash = await getReceiptHash();
    expect(hash).not.toBe(token);
    expect(hash.length).toBeGreaterThan(token.length);
  });
});
