import { useState, useCallback } from "react";
import { encryptFeedback, importPublicKey } from "../services/encryption";
import { getReceiptHash } from "../services/session";
import { submitFeedback } from "../services/api";
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
  const [publicKeyPem, setPublicKeyPem] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submissionId, setSubmissionId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [encryptedPreview, setEncryptedPreview] = useState<{
    payload: string;
    iv: string;
    key: string;
    hash: string;
  } | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage("");

      if (!category || !impact || !feedback.trim() || !publicKeyPem.trim()) {
        setErrorMessage("Please fill in all fields including the public key.");
        return;
      }

      try {
        // Step 1: Import public key
        setSubmitState("encrypting");
        const publicKey = await importPublicKey(publicKeyPem);

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
    },
    [category, impact, feedback, publicKeyPem]
  );

  const resetForm = () => {
    setSubmitState("idle");
    setSubmissionId("");
    setErrorMessage("");
  };

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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Submit Anonymous Feedback
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Your feedback is encrypted in your browser before being sent. The
          server never sees your plaintext content.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Public Key Input */}
        <div>
          <label
            htmlFor="publicKey"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Organization Public Key (PEM)
          </label>
          <textarea
            id="publicKey"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-spill-500 focus:border-transparent"
            placeholder={"-----BEGIN PUBLIC KEY-----\nPaste your organization's RSA public key here...\n-----END PUBLIC KEY-----"}
            value={publicKeyPem}
            onChange={(e) => setPublicKeyPem(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            This key encrypts your feedback so only authorized managers can read
            it.
          </p>
        </div>

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
          />
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
          >
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            submitState === "encrypting" || submitState === "submitting"
          }
          className="w-full py-3 px-4 bg-spill-600 text-white font-medium rounded-lg hover:bg-spill-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-spill-500 focus:ring-offset-2"
        >
          {submitState === "encrypting" && "Encrypting..."}
          {submitState === "submitting" && "Submitting..."}
          {(submitState === "idle" || submitState === "error") &&
            "Encrypt & Submit Anonymously"}
        </button>
      </form>

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
