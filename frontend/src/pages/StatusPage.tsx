import { useState, useEffect, useCallback } from "react";
import { getReceiptHash, hasSessionToken } from "../services/session";
import { checkStatus, withdrawSubmission, type StatusItem } from "../services/api";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800" },
  under_review: { label: "Under Review", color: "bg-yellow-100 text-yellow-800" },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-800" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800" },
};

const CATEGORY_LABELS: Record<string, string> = {
  idea: "Idea",
  complaint: "Complaint",
  suggestion: "Suggestion",
  positive: "Positive Feedback",
  workplace_concern: "Workplace Concern",
};

export default function StatusPage() {
  const [submissions, setSubmissions] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [withdrawConfirm, setWithdrawConfirm] = useState<string | null>(null);

  const fetchStatuses = useCallback(async () => {
    if (!hasSessionToken()) {
      setHasToken(false);
      return;
    }
    setHasToken(true);
    setLoading(true);
    setError("");

    try {
      const receiptHash = await getReceiptHash();
      const result = await checkStatus(receiptHash);
      setSubmissions(result.submissions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check status"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const handleWithdraw = useCallback(async (submissionId: string) => {
    setWithdrawing(submissionId);
    setError("");
    try {
      const receiptHash = await getReceiptHash();
      await withdrawSubmission(submissionId, receiptHash);
      setSubmissions((prev) => prev.filter((s) => s.submission_id !== submissionId));
      setWithdrawConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setWithdrawing(null);
    }
  }, []);

  if (!hasToken) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4" role="img" aria-label="empty">
            📭
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Submissions This Session
          </h2>
          <p className="text-gray-500">
            You haven&apos;t submitted any feedback in this browser session.
            Submit something first, then come back here to track its status.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Note: Status tracking is only available during your current browser
            session. Closing this tab clears your session token.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Your Submissions
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Tracking is session-only — this data disappears when you close this
            tab.
          </p>
        </div>
        <button
          onClick={fetchStatuses}
          disabled={loading}
          className="px-4 py-2 text-sm bg-spill-100 text-spill-700 rounded-lg hover:bg-spill-200 disabled:opacity-50 transition-colors"
          aria-label="Refresh submission statuses"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      {submissions.length === 0 && !loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          No submissions found for this session.
        </div>
      )}

      <div className="space-y-3">
        {submissions.map((item) => {
          const statusInfo = STATUS_LABELS[item.status] || {
            label: item.status,
            color: "bg-gray-100 text-gray-800",
          };
          return (
            <div
              key={item.submission_id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    ID: {item.submission_id}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400">
                    {item.submitted_date}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Impact: {item.impact}
                  </p>
                </div>
              </div>
              {item.status_note && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Note:</span>{" "}
                    {item.status_note}
                  </p>
                </div>
              )}
              {item.status === "submitted" && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  {withdrawConfirm === item.submission_id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600">Are you sure? This cannot be undone.</span>
                      <button
                        onClick={() => handleWithdraw(item.submission_id)}
                        disabled={withdrawing === item.submission_id}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {withdrawing === item.submission_id ? "Withdrawing..." : "Yes, Withdraw"}
                      </button>
                      <button
                        onClick={() => setWithdrawConfirm(null)}
                        className="px-2 py-1 text-xs text-gray-500 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setWithdrawConfirm(item.submission_id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
                    >
                      Withdraw this submission
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
