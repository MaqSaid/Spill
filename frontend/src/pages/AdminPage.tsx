import { useState, useEffect, useCallback, useRef } from "react";
import {
  importPrivateKey,
  decryptFeedback,
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

function getSessionToken(): string | null {
  return sessionStorage.getItem("spill_admin_session");
}

export default function AdminPage() {
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [keyFileName, setKeyFileName] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [decryptedTexts, setDecryptedTexts] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyError, setKeyError] = useState("");
  const [keyLoading, setKeyLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSubmissions = useCallback(async () => {
    const token = getSessionToken();
    if (!token) {
      setError("No active session. Please log in again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await adminListSubmissions(50, 0, token);
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

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setKeyError("");
    setKeyLoading(true);

    // Validate file size (PEM files should be small — max 16KB)
    if (file.size > 16384) {
      setKeyError("File too large. A valid PEM private key file should be under 16KB.");
      setKeyLoading(false);
      return;
    }

    // Validate file extension
    const validExtensions = [".pem", ".key", ".txt"];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!validExtensions.includes(fileExtension)) {
      setKeyError("Invalid file type. Please select a .pem, .key, or .txt file containing your private key.");
      setKeyLoading(false);
      return;
    }

    try {
      const pemText = await file.text();

      // Validate PEM format
      if (!pemText.includes("-----BEGIN PRIVATE KEY-----")) {
        setKeyError(
          "Invalid key format. The file must contain a PKCS#8 PEM private key " +
          "(starting with -----BEGIN PRIVATE KEY-----)."
        );
        setKeyLoading(false);
        return;
      }

      if (!pemText.includes("-----END PRIVATE KEY-----")) {
        setKeyError("Incomplete key file. Missing -----END PRIVATE KEY----- marker.");
        setKeyLoading(false);
        return;
      }

      // Attempt to import the key via Web Crypto API
      const key = await importPrivateKey(pemText);
      setPrivateKey(key);
      setKeyFileName(file.name);
    } catch {
      setKeyError(
        "Failed to import private key. Ensure the file contains a valid RSA-4096 PKCS#8 private key."
      );
    } finally {
      setKeyLoading(false);
      // Reset the file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, []);

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
    const token = getSessionToken();
    if (!token) {
      setError("Session expired. Please log in again.");
      return;
    }
    try {
      const updated = await adminUpdateStatus(submissionId, newStatus, "", token);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? updated : s))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update status"
      );
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
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Private key loaded from <strong>{keyFileName}</strong> — ready to decrypt</span>
            <button
              onClick={() => {
                setPrivateKey(null);
                setKeyFileName(null);
                setDecryptedTexts({});
              }}
              className="ml-auto px-2 py-1 text-xs text-gray-500 border border-gray-300 rounded hover:text-red-600 hover:border-red-300 transition-colors"
              aria-label="Remove loaded private key"
            >
              Clear Key
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Upload your private key to read submissions</p>
              <p className="text-xs text-blue-600">
                Select the private key file (.pem) that corresponds to your organization&apos;s
                public key. The file is read locally in your browser and never uploaded to the server.
              </p>
            </div>

            {/* File picker */}
            <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-spill-400 transition-colors">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <p className="text-sm text-gray-600 text-center">
                {keyLoading ? "Validating key..." : "Select your private key file"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pem,.key,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="private-key-file"
                aria-label="Select private key file"
              />
              <label
                htmlFor="private-key-file"
                className={`px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-colors min-h-[44px] flex items-center ${
                  keyLoading
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-spill-600 text-white hover:bg-spill-700 focus-within:ring-2 focus-within:ring-spill-500 focus-within:ring-offset-2"
                }`}
              >
                {keyLoading ? "Validating..." : "Choose .pem File"}
              </label>
              <p className="text-xs text-gray-400">Accepts .pem, .key, or .txt files (max 16KB)</p>
            </div>

            {keyError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700" role="alert" aria-live="assertive">
                <p className="font-medium">Key import failed</p>
                <p className="mt-1">{keyError}</p>
              </div>
            )}
          </div>
        )}
      </div>

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
