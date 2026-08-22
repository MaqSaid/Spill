/**
 * EncryptionIndicator — Visual indicator showing encryption status.
 *
 * Shows the user real-time feedback about whether their content
 * will be encrypted before leaving the browser.
 */

interface EncryptionIndicatorProps {
  hasContent: boolean;
  state: "idle" | "encrypting" | "submitting" | "success" | "error";
}

export default function EncryptionIndicator({
  hasContent,
  state,
}: EncryptionIndicatorProps) {
  if (state === "encrypting") {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg"
        role="status"
        aria-live="polite"
      >
        <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-sm text-amber-700">
          Encrypting your feedback with AES-256-GCM...
        </span>
      </div>
    );
  }

  if (state === "submitting") {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 bg-spill-50 border border-spill-200 rounded-lg"
        role="status"
        aria-live="polite"
      >
        <div className="w-3 h-3 rounded-full bg-spill-400 animate-pulse" />
        <span className="text-sm text-spill-700">
          Sending encrypted payload to server...
        </span>
      </div>
    );
  }

  if (hasContent) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="text-sm text-green-700">
          Ready — content will be encrypted before sending
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="w-3 h-3 rounded-full bg-gray-300" />
      <span className="text-sm text-gray-500">
        End-to-end encryption enabled (AES-256-GCM + RSA-OAEP)
      </span>
    </div>
  );
}
