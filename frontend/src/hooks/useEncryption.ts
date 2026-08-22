/**
 * useEncryption — custom hook for managing encryption state.
 * Handles public key fetching and encryption operations.
 */

import { useState, useEffect, useCallback } from "react";
import { importPublicKey, encryptFeedback, type EncryptedPayload } from "../services/encryption";
import { fetchPublicKey } from "../services/api";

interface UseEncryptionResult {
  publicKeyReady: boolean;
  loading: boolean;
  error: string | null;
  encrypt: (plaintext: string) => Promise<EncryptedPayload | null>;
}

export function useEncryption(): UseEncryptionResult {
  const [publicKey, setPublicKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadKey() {
      try {
        const pem = await fetchPublicKey();
        if (cancelled) return;
        if (pem) {
          const key = await importPublicKey(pem);
          setPublicKey(key);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load encryption key");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadKey();
    return () => { cancelled = true; };
  }, []);

  const encrypt = useCallback(async (plaintext: string): Promise<EncryptedPayload | null> => {
    if (!publicKey) return null;
    return encryptFeedback(plaintext, publicKey);
  }, [publicKey]);

  return {
    publicKeyReady: publicKey !== null,
    loading,
    error,
    encrypt,
  };
}
