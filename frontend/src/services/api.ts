/**
 * API Client — communicates with the Spill backend.
 *
 * All payloads sent here are already encrypted client-side.
 * No plaintext feedback content ever passes through this layer.
 */

const API_BASE = "/api/v1";

export interface SubmitRequest {
  category: string;
  impact: string;
  encrypted_payload: string;
  encryption_iv: string;
  encrypted_symmetric_key: string;
  receipt_hash: string;
}

export interface SubmitResponse {
  submission_id: string;
  status: string;
  submitted_date: string;
}

export interface StatusItem {
  submission_id: string;
  category: string;
  impact: string;
  status: string;
  submitted_date: string;
  status_note: string;
}

export interface StatusResponse {
  submissions: StatusItem[];
}

export interface AdminSubmission {
  id: string;
  category: string;
  impact: string;
  encrypted_payload: string;
  encryption_iv: string;
  encrypted_symmetric_key: string;
  status: string;
  submitted_date: string;
  status_note: string;
}

export interface AdminListResponse {
  items: AdminSubmission[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Submit encrypted anonymous feedback.
 */
export async function submitFeedback(
  data: SubmitRequest
): Promise<SubmitResponse> {
  const response = await fetch(`${API_BASE}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { detail?: string }).detail || `Submission failed: ${response.status}`
    );
  }

  return response.json() as Promise<SubmitResponse>;
}

/**
 * Check submission status using receipt hash.
 */
export async function checkStatus(
  receiptHash: string
): Promise<StatusResponse> {
  const response = await fetch(`${API_BASE}/submissions/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ receipt_hash: receiptHash }),
  });

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status}`);
  }

  return response.json() as Promise<StatusResponse>;
}

/**
 * List all submissions (admin).
 */
export async function adminListSubmissions(
  limit = 50,
  offset = 0
): Promise<AdminListResponse> {
  const response = await fetch(
    `${API_BASE}/admin/submissions?limit=${limit}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error(`Admin list failed: ${response.status}`);
  }

  return response.json() as Promise<AdminListResponse>;
}

/**
 * Update submission status (admin).
 */
export async function adminUpdateStatus(
  submissionId: string,
  status: string,
  note = ""
): Promise<AdminSubmission> {
  const response = await fetch(
    `${API_BASE}/admin/submissions/${submissionId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { detail?: string }).detail || `Status update failed: ${response.status}`
    );
  }

  return response.json() as Promise<AdminSubmission>;
}
