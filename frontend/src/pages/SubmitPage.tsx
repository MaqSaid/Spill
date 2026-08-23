import { useState, useCallback, useEffect } from "react";
import { encryptFeedback, importPublicKey, generateKeyPair } from "../services/encryption";
import { getReceiptHash } from "../services/session";
import { submitFeedback, fetchPublicKey } from "../services/api";
import EncryptionIndicator from "../components/EncryptionIndicator";

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

function CollapsibleSection({ title, icon, defaultOpen = false, variant = "blue", children }: {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  variant?: "blue" | "green" | "gray";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800",
    gray: "bg-gray-50 border-gray-200 text-gray-700",
  };

  return (
    <div className={`mb-3 border rounded-lg ${colors[variant]}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-left"
        aria-expanded={open}
      >
        <span aria-hidden="true">{icon}</span>
        <span className="flex-1">{title}</span>
        <span className="text-xs opacity-60" aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="px-4 pb-3 text-xs leading-relaxed">{children}</div>}
    </div>
  );
}

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
  const [generatingKey, setGeneratingKey] = useState(false);

  const isFormComplete = category !== "" && impact !== "" && feedback.trim().length > 0 && orgPublicKeyPem !== null;

  useEffect(() => {
    let cancelled = false;
    async function loadKey() {
      try {
        const key = await fetchPublicKey();
        if (!cancelled) {
          setOrgPublicKeyPem(key);
          setKeyLoading(false);
        }
      } catch {
        if (!cancelled) setKeyLoading(false);
      }
    }
    loadKey();
    return () => { cancelled = true; };
  }, []);

  const handleGenerateKey = useCallback(async () => {
    setGeneratingKey(true);
    try {
      const keys = await generateKeyPair();
      setOrgPublicKeyPem(keys.publicKey);
      sessionStorage.setItem("spill_demo_private_key", keys.privateKey);
    } catch {
      setErrorMessage("Failed to generate key pair.");
    } finally {
      setGeneratingKey(false);
    }
  }, []);

  const handleSubmitClick = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!isFormComplete) {
      setErrorMessage("Please complete all fields before submitting.");
      return;
    }
    setShowConfirmation(true);
  }, [isFormComplete]);

  const handleConfirmedSubmit = useCallback(async () => {
    setShowConfirmation(false);
    if (!orgPublicKeyPem) return;
    try {
      setSubmitState("encrypting");
      const publicKey = await importPublicKey(orgPublicKeyPem);
      const encrypted = await encryptFeedback(feedback, publicKey);
      const receiptHash = await getReceiptHash();
      setSubmitState("submitting");
      const result = await submitFeedback({
        category, impact,
        encrypted_payload: encrypted.ciphertext,
        encryption_iv: encrypted.iv,
        encrypted_symmetric_key: encrypted.wrappedKey,
        receipt_hash: receiptHash,
      });
      setSubmissionId(result.submission_id);
      setSubmitState("success");
      setFeedback("");
    } catch (err) {
      setSubmitState("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  }, [category, impact, feedback, orgPublicKeyPem]);

  if (submitState === "success") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4" role="img" aria-label="checkmark">✓</div>
          <h2 className="text-xl font-semibold text-green-800 mb-2">Feedback Submitted Anonymously</h2>
          <p className="text-green-700 mb-4">Your feedback has been encrypted and submitted. No one can trace this back to you.</p>
          <p className="text-sm text-green-600 font-mono bg-green-100 inline-block px-3 py-1 rounded">Reference: {submissionId}</p>
          <p className="text-sm text-gray-500 mt-4">Check &quot;My Status&quot; to track or withdraw within 24 hours.</p>
          <button onClick={() => { setSubmitState("idle"); setSubmissionId(""); }} className="mt-6 px-6 py-2 bg-spill-600 text-white rounded-lg hover:bg-spill-700 transition-colors">
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Collapsible Info Sections */}
      <CollapsibleSection title="Your Employment is Protected" icon="🛡️" defaultOpen={true} variant="green">
        <p>You will <strong>NOT</strong> be disciplined, penalised, or removed from employment for providing honest feedback. This platform makes identification technically impossible — not just by policy, but by design. Australian workplace law protects employees who raise concerns in good faith.</p>
      </CollapsibleSection>

      <CollapsibleSection title="100% Confidential — Cryptographically Guaranteed" icon="🔒" defaultOpen={true} variant="blue">
        <ul className="space-y-1">
          <li>Your feedback is encrypted <strong>in your browser</strong> — the server cannot read it</li>
          <li>No IP address, name, email, or browser information is stored</li>
          <li>Your employer <strong>cannot</strong> identify who submitted this feedback</li>
          <li>Only authorized HR managers can read content — and they cannot see who sent it</li>
        </ul>
      </CollapsibleSection>

      <CollapsibleSection title="How does this work? — Learn about our encryption" icon="❓" defaultOpen={false} variant="gray">
        <div className="space-y-2">
          <p><strong>Step 1:</strong> You type your feedback below.</p>
          <p><strong>Step 2:</strong> Your browser encrypts the text using military-grade AES-256 encryption — before anything is sent.</p>
          <p><strong>Step 3:</strong> The server stores only encrypted (unreadable) data it cannot decrypt.</p>
          <p><strong>Step 4:</strong> Only your HR manager with the decryption key can read it — without knowing who wrote it.</p>
          <p className="font-medium mt-2">No cookies. No login. No tracking. Close the tab and all session data is destroyed.</p>
        </div>
      </CollapsibleSection>

      {/* Non-collapsible warning */}
      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3" role="alert">
        <p className="text-sm text-amber-800 flex items-center gap-2">
          <span aria-hidden="true">⚠️</span>
          <span><strong>Submissions are final.</strong> Cannot be edited. You may withdraw within 24 hours via &quot;My Status&quot; — but only while this browser tab remains open. Closing the tab ends your session permanently.</span>
        </p>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Submit Anonymous Feedback</h2>
      <p className="text-gray-500 text-sm mb-6">Share your thoughts honestly. Everything is encrypted before leaving your browser.</p>

      {/* Key Status */}
      {keyLoading && <div className="mb-4 text-sm text-gray-500 animate-pulse">Setting up encryption...</div>}
      {!keyLoading && !orgPublicKeyPem && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <p className="mb-2">Encryption key not configured by your organization.</p>
          <button
            onClick={handleGenerateKey}
            disabled={generatingKey}
            className="px-3 py-1.5 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 transition-colors"
          >
            {generatingKey ? "Generating..." : "Generate Demo Key (for testing)"}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmitClick} className="space-y-6">
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-400">*</span></legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                  category === cat.value ? "border-spill-500 bg-spill-50 text-spill-800 ring-2 ring-spill-200" : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`} aria-pressed={category === cat.value}>
                <span aria-hidden="true">{cat.icon}</span>{cat.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">Impact Level <span className="text-red-400">*</span></legend>
          <div className="flex gap-2">
            {IMPACTS.map((imp) => (
              <button key={imp.value} type="button" onClick={() => setImpact(imp.value)}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  impact === imp.value ? "border-spill-500 bg-spill-50 text-spill-800 ring-2 ring-spill-200" : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`} aria-pressed={impact === imp.value}>
                {imp.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">Your Feedback <span className="text-red-400">*</span></label>
          <textarea id="feedback" rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spill-500 focus:border-transparent resize-y"
            placeholder="Share your thoughts honestly..."
            value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>

        <EncryptionIndicator hasContent={feedback.trim().length > 0} state={submitState} />

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert" aria-live="assertive">{errorMessage}</div>
        )}

        <div>
          <button type="submit"
            disabled={!isFormComplete || submitState === "encrypting" || submitState === "submitting" || keyLoading}
            className="w-full py-3 px-4 bg-spill-600 text-white font-medium rounded-lg hover:bg-spill-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-spill-500 focus:ring-offset-2"
            title={!isFormComplete ? "Select category, impact, and enter feedback to submit" : "Encrypt and submit anonymously"}>
            {submitState === "encrypting" && "Encrypting..."}
            {submitState === "submitting" && "Submitting..."}
            {(submitState === "idle" || submitState === "error") && "Encrypt & Submit Anonymously"}
          </button>
          {!isFormComplete && <p className="text-xs text-gray-400 text-center mt-2">Complete all fields marked with * to enable submission.</p>}
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 id="confirm-title" className="text-lg font-semibold text-gray-800 mb-3">Confirm Anonymous Submission</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-green-800"><strong>Your identity is cryptographically protected.</strong> No one — not even system administrators — can determine who submitted this.</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800"><strong>Cannot be modified after sending.</strong> You may withdraw within 24 hours from &quot;My Status&quot; — only while this tab stays open.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50" autoFocus>Cancel</button>
              <button onClick={handleConfirmedSubmit} className="px-4 py-2 text-sm bg-spill-600 text-white rounded-lg hover:bg-spill-700 focus:ring-2 focus:ring-spill-500">Submit Anonymously</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
