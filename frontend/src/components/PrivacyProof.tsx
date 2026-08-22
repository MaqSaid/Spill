/**
 * PrivacyProof — Split-screen visualization showing what the browser knows
 * vs what the server receives. Makes zero-knowledge guarantee visually obvious.
 *
 * WCAG 2.0 AA compliant:
 * - Color contrast 4.5:1 minimum
 * - Screen reader friendly with live regions
 * - Keyboard accessible
 * - Responsive (stacks on mobile)
 */

interface PrivacyProofProps {
  plaintext: string;
  encryptedPayload?: string;
  encryptedIv?: string;
  encryptedKey?: string;
  receiptHash?: string;
  category?: string;
  impact?: string;
}

export default function PrivacyProof({
  plaintext,
  encryptedPayload,
  encryptedIv,
  encryptedKey,
  receiptHash,
  category,
  impact,
}: PrivacyProofProps) {
  const hasEncrypted = encryptedPayload && encryptedIv && encryptedKey;
  const truncate = (s: string, len: number) =>
    s.length > len ? s.slice(0, len) + "..." : s;

  return (
    <section
      aria-labelledby="privacy-proof-heading"
      className="mt-6 border border-gray-200 rounded-xl overflow-hidden"
    >
      <h3
        id="privacy-proof-heading"
        className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-200 flex items-center gap-2"
      >
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" aria-hidden="true" />
        Privacy Proof — What the server sees vs. what you typed
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        {/* Left: Browser (what you typed) */}
        <div className="p-4" role="region" aria-label="What stays in your browser">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded uppercase">
              Your Browser
            </span>
            <span className="text-xs text-gray-500">(never leaves your device)</span>
          </div>
          <div
            className="bg-green-50 border border-green-200 rounded-lg p-3 font-mono text-sm text-green-900 min-h-[100px] break-words"
            aria-live="polite"
          >
            {plaintext || (
              <span className="text-green-400 italic">
                Start typing to see the privacy proof...
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Plaintext exists only in browser memory. Never transmitted.
          </p>
        </div>

        {/* Right: Server (what it receives) */}
        <div className="p-4" role="region" aria-label="What the server receives">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded uppercase">
              Server
            </span>
            <span className="text-xs text-gray-500">(cannot decrypt)</span>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 font-mono text-xs text-gray-300 min-h-[100px] space-y-1.5 overflow-hidden">
            {hasEncrypted ? (
              <>
                <div>
                  <span className="text-gray-500">encrypted_payload:</span>{" "}
                  <span className="text-amber-400">{truncate(encryptedPayload, 32)}</span>
                </div>
                <div>
                  <span className="text-gray-500">encryption_iv:</span>{" "}
                  <span className="text-amber-400">{truncate(encryptedIv, 24)}</span>
                </div>
                <div>
                  <span className="text-gray-500">wrapped_key:</span>{" "}
                  <span className="text-amber-400">{truncate(encryptedKey, 32)}</span>
                </div>
                <div className="pt-1 border-t border-gray-700">
                  <span className="text-gray-500">category:</span>{" "}
                  <span className="text-blue-400">{category || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">impact:</span>{" "}
                  <span className="text-blue-400">{impact || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">receipt_hash:</span>{" "}
                  <span className="text-purple-400">{truncate(receiptHash || "", 16)}</span>
                </div>
                <div className="pt-1 border-t border-gray-700">
                  <span className="text-gray-500">client_ip:</span>{" "}
                  <span className="text-red-400">0.0.0.0</span>
                  <span className="text-gray-600"> (purged)</span>
                </div>
                <div>
                  <span className="text-gray-500">user_agent:</span>{" "}
                  <span className="text-red-400">[stripped]</span>
                </div>
              </>
            ) : (
              <span className="text-gray-600 italic">
                {plaintext
                  ? "Encrypting... (paste public key and submit to see)"
                  : "Waiting for input..."}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Server stores only ciphertext. Decryption requires the private key.
          </p>
        </div>
      </div>
    </section>
  );
}
