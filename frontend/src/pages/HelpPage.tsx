import { appConfig } from "../config/app-config";

export default function HelpPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">How {appConfig.branding.appName} Protects Your Identity</h1>

      <div className="space-y-6 text-gray-600 dark:text-gray-300">
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">The Encryption Process</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><strong>You type your feedback</strong> in the text box on the Submit page.</li>
            <li><strong>Your browser encrypts it</strong> using AES-256-GCM (military-grade encryption) — before anything leaves your device.</li>
            <li><strong>The encrypted data is sent</strong> to the server. The server stores only unreadable ciphertext — it physically cannot decrypt your message.</li>
            <li><strong>Only your HR manager</strong>, who holds a separate decryption key, can read the feedback in their own browser. They see the content but cannot determine who wrote it.</li>
          </ol>
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">What We Do NOT Collect</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>No names or email addresses</li>
            <li>No IP addresses (stripped before processing)</li>
            <li>No browser fingerprints or User-Agent strings</li>
            <li>No cookies or persistent identifiers</li>
            <li>No precise timestamps (only date, to prevent timing attacks)</li>
            <li>No login or user accounts</li>
          </ul>
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Session &amp; Withdrawal</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Your session exists only while this browser tab is open</li>
            <li>Closing the tab destroys all session data permanently</li>
            <li>You can withdraw a submission within 24 hours from &quot;My Status&quot; — but only while the tab stays open</li>
            <li>After 24 hours or tab close, withdrawal is not possible (this protects your anonymity)</li>
          </ul>
        </section>

        <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">Employment Protection</h2>
          <p className="text-sm text-green-700 dark:text-green-300">
            Australian workplace law protects employees who raise concerns in good faith. This platform is designed so that identification is technically impossible — your employer cannot discipline or terminate you for anonymous feedback because they cannot determine who submitted it.
          </p>
        </section>
      </div>
    </div>
  );
}
