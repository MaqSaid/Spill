import { useState, useCallback } from "react";
import { adminLogin } from "../services/api";

interface AdminLoginPageProps {
  onLoginSuccess: (sessionToken: string) => void;
}

export default function AdminLoginPage({ onLoginSuccess }: AdminLoginPageProps) {
  const [token, setToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!token.trim() || !totpCode.trim()) {
        setError("Please enter both your admin token and authenticator code.");
        return;
      }

      setLoading(true);
      try {
        const result = await adminLogin(token, totpCode);
        // Store session token in sessionStorage (dies on tab close)
        sessionStorage.setItem("spill_admin_session", result.session_token);
        onLoginSuccess(result.session_token);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed.");
      } finally {
        setLoading(false);
      }
    },
    [token, totpCode, onLoginSuccess]
  );

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <span className="text-3xl" role="img" aria-label="lock">🔐</span>
          <h2 className="text-xl font-semibold text-gray-800 mt-2">Admin Portal</h2>
          <p className="text-sm text-gray-500 mt-1">
            Two-factor authentication required
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-token" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Token
            </label>
            <input
              id="admin-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-spill-500 focus:border-transparent"
              placeholder="Enter your admin token"
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="totp-code" className="block text-sm font-medium text-gray-700 mb-1">
              Authenticator Code
            </label>
            <input
              id="totp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest font-mono focus:ring-2 focus:ring-spill-500 focus:border-transparent"
              placeholder="000000"
              autoComplete="one-time-code"
            />
            <p className="text-xs text-gray-400 mt-1">
              6-digit code from Google Authenticator or similar app
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-spill-600 text-white font-medium rounded-lg hover:bg-spill-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-spill-500 focus:ring-offset-2"
          >
            {loading ? "Authenticating..." : "Login to Admin Portal"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Session expires after 8 hours or when you close this tab.
        </p>
      </div>
    </div>
  );
}
