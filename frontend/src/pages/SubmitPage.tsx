import { useState, useCallback, useEffect } from "react";
import { encryptFeedback, importPublicKey } from "../services/encryption";
import { getReceiptHash } from "../services/session";
import { submitFeedback, fetchPublicKey } from "../services/api";
import EncryptionIndicator from "../components/EncryptionIndicator";
import PrivacyProof from "../components/PrivacyProof";

const CATEGORIES = [
  { value: "idea", label: "Idea", icon: "💡" },
  { value: "complaint", label: "Complaint", icon: "⚠️" },
  { value: "suggestion", label: "Suggestion", icon: "📝" },
  { value: "positive", label: "Positive Feedback", icon: "👏" },
  { value: "workplace_concern", label: "Workplace Concern", icon: "🏢" },
];

const IMPACTS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

type SubmitState = "idle" | "encrypting" | "submitting" | "success" | "error";

export default function SubmitPage() {
  const [category, setCategory] = useState("");
  const [impact, setImpact] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submissionId, setSubmissionId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orgPublicKeyPem, setOrgPublicKeyPem] = useState<string | null>(null);
  const [keyLoading, setKeyLoading] = useState(true);
  const [keyError, setKeyError] = useState("");
  const [encryptedPreview, setEncryptedPreview] = useState<{
    payload: string;
    iv: string;
    key: string;
    hash: string;
  } | null>(null);

  // Auto-fetch organization public key on mount
  useEffect(() => {
    let cancelled = false;
    async function loadKey() {
      try {
        const key = await fetchPublicKey();
        if (!cancelled) {
          setOrgPublicKeyPem(key);
          setKeyLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setKeyError(
            err instanceof Error ? err.message : "Failed to load encryption key"
          );
          setKeyLoading(false);
        }
      }
    }
    loadKey();
    return () => { cancelled = true; };
  }, []);

  const handleSubmitClick = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage("");

      if (!category || !impact || !feedback.trim()) {
        setErrorMessage("Please fill in all fields (category, impact level, and feedback).");
        return;
      }

      if (!orgPublicKeyPem) {
        setErrorMessage("Encryption is not configured. Please contact your administrator.");
        return;
      }

      // Show confirmation modal
      setShowConfirmation(true);
    },
    [category, impact, feedback, orgPublicKeyPem]
  );

  const handleConfirmedSubmit = useCallback(async () => {
    setShowConfirmation(false);

    if (!orgPublicKeyPem) return;

    try {
      // Step 1: Import public key
      setSubmitState("encrypting");
      const publicKey = await importPublicKey(orgPublicKeyPem);

      // Step 2: Encrypt feedback client-side
      const encrypted = await encryptFeedback(feedback, publicKey);

      // Step 3: Get receipt hash from session token
      const receiptHash = await getReceiptHash();

      // Step 4: Submit encrypted payload to server
      setSubmitState("submitting");
      const result = await submitFeedback({
        category,
        impact,
        encrypted_payload: encrypted.ciphertext,
        encryption_iv: encrypted.iv,
        encrypted_symmetric_key: encrypted.wrappedKey,
        receipt_hash: receiptHash,
      });

      // Update privacy proof preview
      setEncryptedPreview({
        payload: encrypted.ciphertext,
        iv: encrypted.iv,
        key: encrypted.wrappedKey,
        hash: receiptHash,
      });

      setSubmissionId(result.submission_id);
      setSubmitState("success");
      setFeedback("");
    } catch (err) {
      setSubmitState("error");
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  }, [category, impact, feedback, orgPublicKeyPem]);

  const resetForm = () => {
    setSubmitState("idle");
    setSubmissionId("");
    setErrorMessage("");
    setShowConfirmation(false);
  };

  // Success state
  if (submitState === "success") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4" role="img" aria-label="checkmark">
            ✓
          </div>
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            Feedback Submitted Anonymously
          </h2>
          <p className="text-green-700 mb-4">
            Your feedback has been encrypted and submitted. No identifying
            information was stored.
          </p>
          <p className="text-sm text-green-600 font-mono bg-green-100 inline-block px-3 py-1 rounded">
            ID: {submissionId}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Check the &quot;My Status&quot; tab to track your submission during
            this session.
          </p>
          <button
            onClick={resetForm}
            className="mt-6 px-6 py-2 bg-spill-600 text-white rounded-lg hover:bg-spill-700 transition-colors"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Privacy Trust Banner */}
      <div
        className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
        role="region"
        aria-label="Privacy information"
      >
        <div className="flex items-start gap-3">
          <span className="text-blue-600 text-xl" aria-hidden="true">🔒</span>
          <div>
            <h3 className="text-sm font-semibold text-blue-800 mb-1">
              Your privacy is protected
            </h3>
            <ul className="text-xs text-blue-700 space-y-0.5">
              <li>Your feedback is encrypted in your browser before being sent — the server cannot read it</li>
              <li>No IP address, browser info, or identity is stored</li>
              <li>Only authorized HR managers with the decryption key can read your feedback</li>
              <li>Your submission cannot be traced back to you</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Warning Banner — Submissions are Final */}
      <div
        className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-3"
        role="alert"
      >
        <p className="text-sm text-amber-800 flex items-center gap-2">
          <span aria-hidden="true">⚠️</span>
          <strong>Submissions are final.</strong> Once submitted, feedback cannot be edited. You may withdraw within 24 hours.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Submit Anonymous Feedback
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Your feedback is encrypted in your browser before being sent. The
          server never sees your plaintext content.
        </p>
      </div>

      {/* Key loading / error states */}
      {keyLoading && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
          Loading encryption configuration...
        </div>
      )}

      {keyError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700" role="alert">
          {keyError}
        </div>
      )}

      {!keyLoading && !orgPublicKeyPem && !keyError && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800" role="alert">
          Encryption is not configured for this organization. Please contact your administrator to set up the encryption key.
        </div>
      )}

      <form onSubmit={handleSubmitClick} className="space-y-6">
        {/* Category Selection */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  category === cat.value
                    ? "border-spill-500 bg-spill-50 text-spill-800"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
                aria-pressed={category === cat.value}
              >
                <span role="img" aria-hidden="true">
                  {cat.icon}
                </span>
                {cat.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Impact Level */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Impact Level
          </legend>
          <div className="flex gap-2">
            {IMPACTS.map((imp) => (
              <button
                key={imp.value}
                type="button"
                onClick={() => setImpact(imp.value)}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  impact === imp.value
                    ? "border-spill-500 bg-spill-50 text-spill-800"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
                aria-pressed={impact === imp.value}
              >
                {imp.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Feedback Text */}
        <div>
          <label
            htmlFor="feedback"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Feedback
          </label>
          <textarea
            id="feedback"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spill-500 focus:border-transparent resize-y"
            placeholder="Share your thoughts honestly. This will be encrypted before leaving your browser..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            aria-describedby="feedback-help"
          />
          <p id="feedback-help" className="text-xs text-gray-400 mt-1">
            Your text is encrypted with AES-256-GCM before transmission. The server only stores ciphertext.
          </p>
        </div>

        {/* Encryption Indicator */}
        <EncryptionIndicator
          hasContent={feedback.trim().length > 0}
          state={submitState}
        />

        {/* Error Message */}
        {errorMessage && (
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"
            role="alert"
            aria-live="assertive"
          >
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            submitState === "encrypting" ||
            submitState === "submitting" ||
            keyLoading ||
            !orgPublicKeyPem
          }
          className="w-full py-3 px-4 bg-spill-600 text-white font-medium rounded-lg hover:bg-spill-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-spill-500 focus:ring-offset-2"
        >
          {submitState === "encrypting" && "Encrypting..."}
          {submitState === "submitting" && "Submitting..."}
          {(submitState === "idle" || submitState === "error") &&
            "Encrypt & Submit Anonymously"}
        </button>
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 id="confirm-title" className="text-lg font-semibold text-gray-800 mb-3">
              Confirm Submission
            </h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800">
                <strong>Once submitted, your feedback cannot be modified.</strong> You may withdraw within 24 hours, after which it becomes permanent.
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Your feedback will be encrypted and sent anonymously. No one can trace it back to you.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                autoFocus
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedSubmit}
                className="px-4 py-2 text-sm bg-spill-600 text-white rounded-lg hover:bg-spill-700 transition-colors focus:outline-none focus:ring-2 focus:ring-spill-500"
              >
                Submit Anonymously
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Proof — live visualization */}
      <PrivacyProof
        plaintext={feedback}
        encryptedPayload={encryptedPreview?.payload}
        encryptedIv={encryptedPreview?.iv}
        encryptedKey={encryptedPreview?.key}
        receiptHash={encryptedPreview?.hash}
        category={category}
        impact={impact}
      />
    </div>
  );
}
