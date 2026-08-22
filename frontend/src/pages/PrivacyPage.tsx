export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto prose prose-sm">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
      
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700">1. Information We Collect</h2>
        <p className="text-gray-600 mt-2">
          Spill collects only the minimum information necessary for anonymous employee feedback:
        </p>
        <ul className="text-gray-600 mt-2 space-y-1">
          <li><strong>Encrypted feedback content</strong> — your feedback is encrypted in your browser using AES-256-GCM before being sent. The server stores only ciphertext that it cannot decrypt.</li>
          <li><strong>Category and impact level</strong> — your selected feedback category and impact rating.</li>
          <li><strong>Submission date</strong> — the date of submission (no time precision, to prevent timing correlation).</li>
          <li><strong>Receipt hash</strong> — a one-way hash of your session token, used only for status tracking during your active browser session.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700">2. Information We Do NOT Collect</h2>
        <ul className="text-gray-600 mt-2 space-y-1">
          <li>No names, email addresses, or user accounts</li>
          <li>No IP addresses (stripped by middleware before processing)</li>
          <li>No browser fingerprints or User-Agent strings</li>
          <li>No cookies or persistent identifiers</li>
          <li>No precise timestamps (only date)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700">3. How We Protect Your Data</h2>
        <ul className="text-gray-600 mt-2 space-y-1">
          <li>Client-side encryption using AES-256-GCM (military-grade)</li>
          <li>RSA-OAEP 4096-bit key wrapping — only authorized managers can decrypt</li>
          <li>Zero-knowledge architecture — the server physically cannot read your feedback</li>
          <li>All identifying metadata is purged before request processing</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700">4. Who Can Access Your Feedback</h2>
        <p className="text-gray-600 mt-2">
          Only authorized HR managers who possess the organization&apos;s RSA private key can decrypt and read feedback content. The decryption happens exclusively in their browser — the server never has access to plaintext.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700">5. Data Retention</h2>
        <ul className="text-gray-600 mt-2 space-y-1">
          <li>Resolved submissions are automatically deleted after the configured retention period (default: 12 months)</li>
          <li>You may withdraw your submission within 24 hours of submitting</li>
          <li>Deletion is permanent — data cannot be recovered after purge</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700">6. Your Rights</h2>
        <p className="text-gray-600 mt-2">
          Under the Australian Privacy Act 1988, you have the right to:
        </p>
        <ul className="text-gray-600 mt-2 space-y-1">
          <li>Submit feedback without providing personal identification</li>
          <li>Check the status of your submissions during your active session</li>
          <li>Withdraw submissions within 24 hours</li>
          <li>Be informed about data breaches that may affect you (within 72 hours)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700">7. Data Sovereignty</h2>
        <p className="text-gray-600 mt-2">
          All data is hosted within Australia. No data is transferred outside Australian jurisdiction without explicit consent.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700">8. Contact</h2>
        <p className="text-gray-600 mt-2">
          For privacy concerns or data breach notifications, contact your organization&apos;s privacy officer or HR department.
        </p>
      </section>
    </div>
  );
}
