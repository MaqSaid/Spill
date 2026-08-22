/**
 * Encryption Service — Round-trip tests.
 *
 * Tests the full encrypt → decrypt cycle to verify zero-knowledge
 * encryption works correctly end-to-end.
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  encryptFeedback,
  decryptFeedback,
  generateKeyPair,
  importPublicKey,
  importPrivateKey,
  type EncryptedPayload,
} from "../services/encryption";

describe("Encryption Round-Trip", () => {
  let publicKeyPem: string;
  let privateKeyPem: string;
  let publicKey: CryptoKey;
  let privateKey: CryptoKey;

  beforeAll(async () => {
    // Generate a test key pair (smaller for speed in tests)
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048, // Smaller for test speed
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["wrapKey", "unwrapKey"]
    );

    const publicKeyDer = await crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );
    const privateKeyDer = await crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );

    publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${arrayBufferToBase64Lines(publicKeyDer)}\n-----END PUBLIC KEY-----`;
    privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${arrayBufferToBase64Lines(privateKeyDer)}\n-----END PRIVATE KEY-----`;

    publicKey = await importPublicKey(publicKeyPem);
    privateKey = await importPrivateKey(privateKeyPem);
  });

  it("encrypts and decrypts a simple message", async () => {
    const plaintext = "This is anonymous feedback.";

    const encrypted = await encryptFeedback(plaintext, publicKey);
    const decrypted = await decryptFeedback(encrypted, privateKey);

    expect(decrypted).toBe(plaintext);
  });

  it("encrypts and decrypts unicode content", async () => {
    const plaintext = "Feedback with unicode: 日本語テスト 🔒🛡️";

    const encrypted = await encryptFeedback(plaintext, publicKey);
    const decrypted = await decryptFeedback(encrypted, privateKey);

    expect(decrypted).toBe(plaintext);
  });

  it("encrypts and decrypts a long message", async () => {
    const plaintext = "A".repeat(10000);

    const encrypted = await encryptFeedback(plaintext, publicKey);
    const decrypted = await decryptFeedback(encrypted, privateKey);

    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext for the same plaintext (random IV + key)", async () => {
    const plaintext = "Same message encrypted twice.";

    const encrypted1 = await encryptFeedback(plaintext, publicKey);
    const encrypted2 = await encryptFeedback(plaintext, publicKey);

    // Ciphertext must differ (unique AES key + IV each time)
    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    expect(encrypted1.iv).not.toBe(encrypted2.iv);
    expect(encrypted1.wrappedKey).not.toBe(encrypted2.wrappedKey);

    // But both decrypt to the same plaintext
    const decrypted1 = await decryptFeedback(encrypted1, privateKey);
    const decrypted2 = await decryptFeedback(encrypted2, privateKey);
    expect(decrypted1).toBe(plaintext);
    expect(decrypted2).toBe(plaintext);
  });

  it("fails to decrypt with wrong private key", async () => {
    const plaintext = "Secret feedback";
    const encrypted = await encryptFeedback(plaintext, publicKey);

    // Generate a different key pair
    const wrongKeyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["wrapKey", "unwrapKey"]
    );
    const wrongPrivateKeyDer = await crypto.subtle.exportKey(
      "pkcs8",
      wrongKeyPair.privateKey
    );
    const wrongPem = `-----BEGIN PRIVATE KEY-----\n${arrayBufferToBase64Lines(wrongPrivateKeyDer)}\n-----END PRIVATE KEY-----`;
    const wrongPrivateKey = await importPrivateKey(wrongPem);

    await expect(
      decryptFeedback(encrypted, wrongPrivateKey)
    ).rejects.toThrow();
  });

  it("produces valid base64 in encrypted payload", async () => {
    const encrypted = await encryptFeedback("test", publicKey);

    // All fields should be valid base64
    expect(() => atob(encrypted.ciphertext)).not.toThrow();
    expect(() => atob(encrypted.iv)).not.toThrow();
    expect(() => atob(encrypted.wrappedKey)).not.toThrow();
  });

  it("encrypted payload contains expected structure", async () => {
    const encrypted: EncryptedPayload = await encryptFeedback(
      "structure test",
      publicKey
    );

    expect(encrypted).toHaveProperty("ciphertext");
    expect(encrypted).toHaveProperty("iv");
    expect(encrypted).toHaveProperty("wrappedKey");
    expect(typeof encrypted.ciphertext).toBe("string");
    expect(typeof encrypted.iv).toBe("string");
    expect(typeof encrypted.wrappedKey).toBe("string");
    expect(encrypted.ciphertext.length).toBeGreaterThan(0);
    expect(encrypted.iv.length).toBeGreaterThan(0);
    expect(encrypted.wrappedKey.length).toBeGreaterThan(0);
  });
});

describe("Key Pair Generation", () => {
  it("generates valid PEM-formatted key pair", async () => {
    const { publicKey, privateKey } = await generateKeyPair();

    expect(publicKey).toContain("-----BEGIN PUBLIC KEY-----");
    expect(publicKey).toContain("-----END PUBLIC KEY-----");
    expect(privateKey).toContain("-----BEGIN PRIVATE KEY-----");
    expect(privateKey).toContain("-----END PRIVATE KEY-----");
  });

  it("generated key pair can encrypt and decrypt", async () => {
    const { publicKey: pubPem, privateKey: privPem } = await generateKeyPair();

    const pubKey = await importPublicKey(pubPem);
    const privKey = await importPrivateKey(privPem);

    const plaintext = "Test with generated keys";
    const encrypted = await encryptFeedback(plaintext, pubKey);
    const decrypted = await decryptFeedback(encrypted, privKey);

    expect(decrypted).toBe(plaintext);
  });
});

// Helper used in test setup
function arrayBufferToBase64Lines(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const lines: string[] = [];
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.slice(i, i + 64));
  }
  return lines.join("\n");
}
