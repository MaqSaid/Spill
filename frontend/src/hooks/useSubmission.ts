/**
 * useSubmission — custom hook for managing submission state and API calls.
 */

import { useState, useCallback } from "react";
import { submitFeedback } from "../services/api";
import { getReceiptHash } from "../services/session";
import { type EncryptedPayload } from "../services/encryption";

interface UseSubmissionResult {
  submitting: boolean;
  submissionId: string | null;
  error: string | null;
  submit: (encrypted: EncryptedPayload, category: string, impact: string) => Promise<boolean>;
  reset: () => void;
}

export function useSubmission(): UseSubmissionResult {
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (
    encrypted: EncryptedPayload,
    category: string,
    impact: string
  ): Promise<boolean> => {
    setSubmitting(true);
    setError(null);

    try {
      const receiptHash = await getReceiptHash();
      const result = await submitFeedback({
        category,
        impact,
        encrypted_payload: encrypted.ciphertext,
        encryption_iv: encrypted.iv,
        encrypted_symmetric_key: encrypted.wrappedKey,
        receipt_hash: receiptHash,
      });
      setSubmissionId(result.submission_id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSubmissionId(null);
    setError(null);
    setSubmitting(false);
  }, []);

  return { submitting, submissionId, error, submit, reset };
}
