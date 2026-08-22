/**
 * Encryption Service — Client-side zero-knowledge encryption using Web Crypto API.
 *
 * Flow:
 * 1. Generate random AES-256-GCM key
 * 2. Encrypt plaintext with AES key → ciphertext + IV
 * 3. Encrypt AES key with RSA-OAEP public key → wrapped key
 * 4. Return { ciphertext, iv, wrappedKey } — all Base64 encoded
 *
 * Decryption (admin only):
 * 1. Import RSA private key
 * 2. Unwrap AES key using RSA private key
 * 3. Decrypt ciphertext with AES key + IV → plaintext
 */

export interface EncryptedPayload {
  ciphertext: string; // Base64-encoded AES-256-GCM ciphertext
  iv: string; // Base64-encoded 12-byte IV
  wrappedKey: string; // Base64-encoded RSA-OAEP encrypted AES key
}

/**
 * Import an RSA-OAEP public key from PEM format for encryption.
 */
export async function importPublicKey(pemKey: string): Promise<CryptoKey> {
  const pemContents = pemKey
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s/g, "");

  const binaryDer = base64ToArrayBuffer(pemContents);

  return window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["wrapKey"]
  );
}

/**
 * Import an RSA-OAEP private key from PEM format for decryption.
 */
export async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  const pemContents = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const binaryDer = base64ToArrayBuffer(pemContents);

  return window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["unwrapKey"]
  );
}

/**
 * Encrypt plaintext feedback using AES-256-GCM + RSA-OAEP key wrapping.
 *
 * This is the core zero-knowledge function — after this call,
 * only the holder of the RSA private key can decrypt the content.
 */
export async function encryptFeedback(
  plaintext: string,
  publicKey: CryptoKey
): Promise<EncryptedPayload> {
  // 1. Generate a random AES-256-GCM key
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable — needed for wrapping
    ["encrypt"]
  );

  // 2. Generate a random 12-byte IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 3. Encrypt the plaintext with AES-GCM
  const encoder = new TextEncoder();
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoder.encode(plaintext)
  );

  // 4. Wrap (encrypt) the AES key with the RSA public key
  const wrappedKey = await window.crypto.subtle.wrapKey(
    "raw",
    aesKey,
    publicKey,
    { name: "RSA-OAEP" }
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer),
    wrappedKey: arrayBufferToBase64(wrappedKey),
  };
}

/**
 * Decrypt feedback using the RSA private key (admin-only, client-side).
 */
export async function decryptFeedback(
  payload: EncryptedPayload,
  privateKey: CryptoKey
): Promise<string> {
  // 1. Unwrap the AES key using the RSA private key
  const aesKey = await window.crypto.subtle.unwrapKey(
    "raw",
    base64ToArrayBuffer(payload.wrappedKey),
    privateKey,
    { name: "RSA-OAEP" },
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // 2. Decrypt the ciphertext with the AES key
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToArrayBuffer(payload.iv) },
    aesKey,
    base64ToArrayBuffer(payload.ciphertext)
  );

  // 3. Decode UTF-8 plaintext
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Generate an RSA-OAEP 4096-bit key pair (for initial setup / demo).
 */
export async function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["wrapKey", "unwrapKey"]
  );

  const publicKeyDer = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );
  const privateKeyDer = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );

  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${arrayBufferToBase64Lines(publicKeyDer)}\n-----END PUBLIC KEY-----`;
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${arrayBufferToBase64Lines(privateKeyDer)}\n-----END PRIVATE KEY-----`;

  return { publicKey: publicKeyPem, privateKey: privateKeyPem };
}

// ─── Utility Functions ─────────────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function arrayBufferToBase64Lines(buffer: ArrayBuffer): string {
  const base64 = arrayBufferToBase64(buffer);
  const lines: string[] = [];
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.slice(i, i + 64));
  }
  return lines.join("\n");
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
