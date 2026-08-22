# Spill — Requirements Specification

## Overview

Spill is a zero-knowledge, 100% anonymous employee feedback and reporting web application. Employees submit ideas, complaints, suggestions, positive feedback, or workplace concerns with absolute privacy guaranteed through client-side encryption and metadata purging.

## Functional Requirements

### FR-1: Anonymous Feedback Submission
- **FR-1.1**: Users can submit feedback without any authentication or account creation.
- **FR-1.2**: Users select a category: Idea, Complaint, Suggestion, Positive, Workplace Concern.
- **FR-1.3**: Users select an impact level: Low, Medium, High, Critical.
- **FR-1.4**: Feedback text is encrypted client-side before network transit using AES-256-GCM.
- **FR-1.5**: A real-time encryption status indicator shows the user when content is encrypted.
- **FR-1.6**: On successful submission, a confirmation is shown with the submission ID.

### FR-2: Session-Based Status Tracking
- **FR-2.1**: An ephemeral 128-bit receipt token is generated and stored in `sessionStorage`.
- **FR-2.2**: `SHA-256(sessionToken)` is sent with submissions to link them to the session.
- **FR-2.3**: Users can view their submission statuses during the active browser session.
- **FR-2.4**: Status values: Submitted, Under Review, In Progress, Resolved.
- **FR-2.5**: Status lookup requires only the receipt hash — no identity verification.

### FR-3: Management Admin Portal
- **FR-3.1**: Managers can view all submissions (encrypted payloads).
- **FR-3.2**: Managers input their RSA private key client-side to decrypt submissions.
- **FR-3.3**: The private key never leaves the browser — decryption is local only.
- **FR-3.4**: Managers can update submission status with notes.
- **FR-3.5**: Status transitions follow a valid state machine (no skipping steps).

### FR-4: Encryption Key Management
- **FR-4.1**: Organization generates an RSA-OAEP 4096-bit key pair offline.
- **FR-4.2**: The public key is distributed with the frontend application.
- **FR-4.3**: The private key is held exclusively by authorized managers.
- **FR-4.4**: Each submission generates a fresh AES-256-GCM symmetric key.
- **FR-4.5**: The AES key is encrypted with the RSA public key before transmission.

## Non-Functional Requirements

### NFR-1: Privacy & Zero-Knowledge
- **NFR-1.1**: Server never has access to plaintext feedback content.
- **NFR-1.2**: IP addresses are stripped from all requests via middleware.
- **NFR-1.3**: User-Agent strings are purged before processing.
- **NFR-1.4**: Timestamps are rounded to 24-hour windows (date only).
- **NFR-1.5**: No cookies, JWTs, or persistent session identifiers are used.
- **NFR-1.6**: No correlation between submissions and network metadata is possible.

### NFR-2: Security
- **NFR-2.1**: All data in transit uses HTTPS/TLS 1.3.
- **NFR-2.2**: AES-256-GCM provides authenticated encryption.
- **NFR-2.3**: RSA-OAEP with SHA-256 provides asymmetric key wrapping.
- **NFR-2.4**: No server-side decryption capability exists.
- **NFR-2.5**: Input validation prevents injection attacks.

### NFR-3: Performance
- **NFR-3.1**: Submission response time < 500ms (P95).
- **NFR-3.2**: Status lookup response time < 200ms (P95).
- **NFR-3.3**: Client-side encryption completes in < 100ms.
- **NFR-3.4**: Application supports 1000+ concurrent submissions.

### NFR-4: Accessibility
- **NFR-4.1**: WCAG 2.1 AA compliance for all user-facing pages.
- **NFR-4.2**: Full keyboard navigation support.
- **NFR-4.3**: Screen reader compatible form elements.
- **NFR-4.4**: Sufficient color contrast ratios (4.5:1 minimum).

### NFR-5: Reliability
- **NFR-5.1**: 99.9% uptime SLA target.
- **NFR-5.2**: Graceful degradation if database is temporarily unavailable.
- **NFR-5.3**: Client-side validation prevents invalid submissions.

## Constraints

- **C-1**: No user accounts or identity system of any kind.
- **C-2**: No server-side logging of request metadata beyond sanitized access logs.
- **C-3**: Frontend must function as a static SPA (CDN-deployable).
- **C-4**: Backend must be stateless and horizontally scalable.
- **C-5**: All browser data is session-scoped — nothing persists after tab close.
