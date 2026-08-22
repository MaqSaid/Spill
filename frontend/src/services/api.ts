/**
 * API Client — communicates with the Spill backend.
 *
 * All payloads sent here are already encrypted client-side.
 * No plaintext feedback content ever passes through this layer.
 */

const API_BASE = "/api/v1";

/**
 * Fetch the organization's RSA public key for encryption.
 * Returns null if no key is configured.
 */
export async function fetchPublicKey(): Promise<string | null> {
  const response = await fetch(`${API_BASE}/public-key`);

  if (response.status === 404) {
    return null; // No key configured
  }

  if (!response.ok) {
    throw new Error("Failed to fetch encryption key. Please try again later.");
  }

  const data = (await response.json()) as { public_key: string };
  return data.public_key;
}

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
 * Admin login with token + TOTP code.
 */
export async function adminLogin(
  token: string,
  totpCode: string
): Promise<{ session_token: string; expires_in: number }> {
  const response = await fetch(`${API_BASE}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, totp_code: totpCode }),
  });

  if (response.status === 423) {
    throw new Error("Account is temporarily locked due to too many failed attempts. Try again later.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { detail?: string }).detail || "Authentication failed."
    );
  }

  return response.json() as Promise<{ session_token: string; expires_in: number }>;
}

/**
 * Admin logout — invalidate session.
 */
export async function adminLogout(sessionToken: string): Promise<void> {
  await fetch(`${API_BASE}/admin/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

/**
 * List all submissions (admin) — requires auth.
 */
export async function adminListSubmissions(
  limit = 50,
  offset = 0,
  sessionToken?: string
): Promise<AdminListResponse> {
  const headers: Record<string, string> = {};
  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  }

  const response = await fetch(
    `${API_BASE}/admin/submissions?limit=${limit}&offset=${offset}`,
    { headers }
  );

  if (response.status === 401) {
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(`Admin list failed: ${response.status}`);
  }

  return response.json() as Promise<AdminListResponse>;
}

/**
 * Update submission status (admin) — requires auth.
 */
export async function adminUpdateStatus(
  submissionId: string,
  status: string,
  note = "",
  sessionToken?: string
): Promise<AdminSubmission> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  }

  const response = await fetch(
    `${API_BASE}/admin/submissions/${submissionId}/status`,
    {
      method: "PATCH",
      headers,
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
