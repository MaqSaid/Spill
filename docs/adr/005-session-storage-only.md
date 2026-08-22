# ADR-005: sessionStorage Only (No Persistent Client State)

## Status

Accepted

## Context

Users need to check the status of their submissions during a browser session. This requires some form of client-side state to link a user to their submissions. The options considered were:

- **Cookies**: Persistent, sent with every request, trackable across sessions
- **localStorage**: Persistent across tab closes and browser restarts
- **sessionStorage**: Scoped to a single tab, destroyed on close

## Decision

Use `sessionStorage` exclusively. No `localStorage`, no cookies, no persistent identifiers.

Implementation:
- A 128-bit random receipt token is generated on first submission
- Stored in `sessionStorage` under a single key (`spill_receipt_token`)
- Only `SHA-256(token)` is ever sent to the server
- The token and all session state are destroyed when the browser tab closes

## Consequences

- **Positive**: No cross-session tracking is possible. Each tab close is a complete identity reset.
- **Positive**: No cookies means no CSRF attacks and no cookie consent requirements.
- **Positive**: The server never sees the raw token — only a one-way hash — so even a compromised server cannot impersonate a user's session.
- **Negative**: Users cannot check submission status after closing the tab. This is intentional — it's a feature, not a bug.
- **Negative**: Multiple tabs may generate independent tokens (each tab is a separate "identity").
- **Accepted tradeoff**: The impossibility of cross-session tracking is the core anonymity guarantee. The UX cost (status tracking lost on tab close) is acceptable for the privacy benefit.
