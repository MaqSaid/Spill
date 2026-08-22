import { useState, useEffect, useCallback } from "react";
import {
  importPrivateKey,
  decryptFeedback,
  generateKeyPair,
} from "../services/encryption";
import {
  adminListSubmissions,
  adminUpdateStatus,
  type AdminSubmission,
} from "../services/api";

const STATUS_OPTIONS = [
  { value: "under_review", label: "Under Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
};

export default function AdminPage() {
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [decryptedTexts, setDecryptedTexts] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyError, setKeyError] = useState("");
  const [generatingKeys, setGeneratingKeys] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<{
    publicKey: string;
    privateKey: string;
  } | null>(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminListSubmissions();
      setSubmissions(result.items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load submissions"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleImportKey = async () => {
    setKeyError("");
    try {
      const key = await importPrivateKey(privateKeyPem);
      setPrivateKey(key);
    } catch {
      setKeyError(
        "Failed to import private key. Ensure it is a valid PKCS#8 PEM RSA key."
      );
    }
  };

  const handleDecrypt = async (submission: AdminSubmission) => {
    if (!privateKey) return;
    try {
      const plaintext = await decryptFeedback(
        {
          ciphertext: submission.encrypted_payload,
          iv: submission.encryption_iv,
          wrappedKey: submission.encrypted_symmetric_key,
        },
        privateKey
      );
      setDecryptedTexts((prev) => ({ ...prev, [submission.id]: plaintext }));
    } catch {
      setDecryptedTexts((prev) => ({
        ...prev,
        [submission.id]: "[Decryption failed — wrong key or corrupted data]",
      }));
    }
  };

  const handleStatusUpdate = async (
    submissionId: string,
    newStatus: string
  ) => {
    try {
      const updated = await adminUpdateStatus(submissionId, newStatus);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? updated : s))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update status"
      );
    }
  };

  const handleGenerateKeys = async () => {
    setGeneratingKeys(true);
    try {
      const keys = await generateKeyPair();
      setGeneratedKeys(keys);
    } catch {
      setError("Failed to generate key pair");
    } finally {
      setGeneratingKeys(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Admin Dashboard
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Decrypt and manage anonymous submissions. Your private key stays in
          this browser — it is never sent to the server.
        </p>
      </div>

      {/* Key Management Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Decryption Key
        </h3>

        {privateKey ? (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            <span>Private key loaded — ready to decrypt submissions</span>
            <button
              onClick={() => {
                setPrivateKey(null);
                setDecryptedTexts({});
              }}
              className="ml-auto text-xs text-gray-500 hover:text-red-600"
            >
              Clear Key
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-spill-500 focus:border-transparent"
              placeholder={"-----BEGIN PRIVATE KEY-----\nPaste your RSA private key here...\n-----END PRIVATE KEY-----"}
              value={privateKeyPem}
              onChange={(e) => setPrivateKeyPem(e.target.value)}
              aria-label="RSA private key input"
            />
            {keyError && (
              <p className="text-xs text-red-600">{keyError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleImportKey}
                disabled={!privateKeyPem.trim()}
                className="px-4 py-2 text-sm bg-spill-600 text-white rounded-lg hover:bg-spill-700 disabled:opacity-50 transition-colors"
              >
                Load Private Key
              </button>
              <button
                onClick={handleGenerateKeys}
                disabled={generatingKeys}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                {generatingKeys
                  ? "Generating..."
                  : "Generate Demo Key Pair"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generated Keys Display */}
      {generatedKeys && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">
            Generated Key Pair (Demo Only)
          </h3>
          <p className="text-xs text-amber-700 mb-3">
            Save these keys securely. The public key goes in the submission
            form. The private key is for decryption here.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-amber-700">
                Public Key (share with employees):
              </label>
              <textarea
                readOnly
                rows={3}
                className="w-full mt-1 px-2 py-1 bg-white border border-amber-200 rounded text-xs font-mono"
                value={generatedKeys.publicKey}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-amber-700">
                Private Key (keep secret — admin only):
              </label>
              <textarea
                readOnly
                rows={3}
                className="w-full mt-1 px-2 py-1 bg-white border border-amber-200 rounded text-xs font-mono"
                value={generatedKeys.privateKey}
              />
            </div>
          </div>
          <button
            onClick={() => setGeneratedKeys(null)}
            className="mt-3 text-xs text-amber-600 hover:text-amber-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Submissions List */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Submissions ({submissions.length})
        </h3>
        <button
          onClick={loadSubmissions}
          disabled={loading}
          className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {submissions.length === 0 && !loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          No submissions yet.
        </div>
      )}

      <div className="space-y-4">
        {submissions.map((sub) => (
          <div
            key={sub.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 capitalize">
                  {sub.category.replace("_", " ")}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sub.status] || "bg-gray-100"}`}
                >
                  {sub.status.replace("_", " ")}
                </span>
                <span className="text-xs text-gray-400">
                  Impact: {sub.impact}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {sub.submitted_date}
              </span>
            </div>

            {/* Decrypted Content */}
            <div className="mb-3">
              {decryptedTexts[sub.id] ? (
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
                  {decryptedTexts[sub.id]}
                </div>
              ) : (
                <button
                  onClick={() => handleDecrypt(sub)}
                  disabled={!privateKey}
                  className="text-xs text-spill-600 hover:text-spill-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {privateKey
                    ? "Click to decrypt"
                    : "Load private key to decrypt"}
                </button>
              )}
            </div>

            {/* Status Management */}
            {sub.status !== "resolved" && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Update status:</span>
                {STATUS_OPTIONS.filter(
                  (opt) => opt.value !== sub.status
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusUpdate(sub.id, opt.value)}
                    className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* ID */}
            <p className="text-xs text-gray-300 mt-2 font-mono">
              {sub.id}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
