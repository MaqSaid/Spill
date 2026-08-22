# Threat Model — Spill

## Overview

Spill is a zero-knowledge anonymous employee feedback platform. This document analyzes the threats the system is designed to defend against, the mitigations in place, and residual risks.

## Assets to Protect

| Asset | Sensitivity | Location |
|-------|------------|----------|
| Feedback content (plaintext) | Critical | Browser memory only (never persisted) |
| RSA private key | Critical | Manager's local device only |
| Encrypted payloads | Medium | Server database |
| Receipt tokens | Low | Browser sessionStorage (ephemeral) |
| Submission metadata (category, impact) | Low | Server database (unencrypted) |

## Threat Actors

1. **Curious Administrator**: Has database access, wants to identify who wrote negative feedback
2. **Network Attacker**: Can intercept traffic between browser and server
3. **Server Compromiser**: Gains full access to the backend server and database
4. **Insider with Logs**: Has access to application logs and monitoring systems
5. **Correlation Attacker**: Uses timing, metadata, or behavioral patterns to de-anonymize

## Threats and Mitigations

### T1: Server-Side Plaintext Access

**Threat**: Administrator or attacker reads feedback content from the database.

**Mitigation**: All feedback is encrypted client-side with AES-256-GCM before transmission. The server stores only ciphertext. The AES key is wrapped with RSA-OAEP (4096-bit) — the server never possesses the private key.

**Residual Risk**: None. This is a cryptographic guarantee, not an access control.

### T2: Network Eavesdropping

**Threat**: Attacker intercepts data in transit.

**Mitigation**: TLS 1.3 at the transport layer. Even without TLS, the payload is already AES-256-GCM encrypted — an eavesdropper sees double-encrypted data.

**Residual Risk**: Minimal. TLS metadata (connection timing, IP) is visible to network observers but content is protected.

### T3: IP Address Correlation

**Threat**: Administrator correlates submission timestamps with VPN/network logs to identify employees.

**Mitigation**: `MetadataPurgingMiddleware` strips all identifying headers (X-Forwarded-For, X-Real-IP, User-Agent, CF-Connecting-IP, etc.) and overrides the client IP to `0.0.0.0` in the ASGI scope. No IP address reaches the application layer or database.

**Residual Risk**: Load balancer access logs upstream of the application may still contain IP data. Mitigation: configure load balancers to disable access logging or purge logs.

### T4: Timing Correlation Attack

**Threat**: Administrator notices an employee left a meeting at 2:15 PM, and a submission arrived at 2:16 PM.

**Mitigation**: Timestamps are bucketed to DATE only (24-hour windows). A submission made at 2:16 PM is stored as "January 15" — indistinguishable from any other submission that day.

**Residual Risk**: If only one submission arrives on a given day, the anonymity set is 1. Mitigation: encourage regular feedback to increase the anonymity set per day.

### T5: User-Agent Fingerprinting

**Threat**: Cross-referencing User-Agent strings with known employee browser configurations.

**Mitigation**: User-Agent header is purged by middleware before processing. Never logged or stored.

**Residual Risk**: None at the application level.

### T6: Session Token Theft

**Threat**: Attacker steals the session receipt token to view someone's submission status.

**Mitigation**: Token is stored in `sessionStorage` only (cleared on tab close). Only `SHA-256(token)` is sent to the server. The server cannot reverse the hash to obtain the token.

**Residual Risk**: If an attacker has physical access to an open browser tab, they could read sessionStorage. Mitigation: this is acceptable — physical access to an active session implies full compromise regardless.

### T7: Replay Attacks

**Threat**: Attacker captures and replays a submission request.

**Mitigation**: Each submission generates a unique ULID. Duplicate submissions create new entries (not duplicates of existing ones). The receipt hash ties submissions to a session, not to content.

**Residual Risk**: Low. Replayed submissions would appear as additional anonymous feedback — annoying but not a privacy breach.

### T8: RSA Private Key Compromise

**Threat**: The management RSA private key is stolen, allowing decryption of all submissions.

**Mitigation**: The private key never touches the server. It exists only on authorized managers' devices and is imported into the browser for decryption.

**Residual Risk**: If the private key is compromised, all past and future submissions (until key rotation) are readable. Mitigation: implement key rotation procedures and limit private key distribution.

### T9: Malicious Frontend Code

**Threat**: A supply chain attack modifies the frontend to exfiltrate plaintext before encryption.

**Mitigation**: Subresource Integrity (SRI) on CDN-served assets. npm audit in CI pipeline. Dependency pinning with lock files.

**Residual Risk**: A sophisticated supply chain attack on a direct dependency could still inject malicious code. Mitigation: regular dependency audits and minimal dependency surface.

### T10: Metadata Leakage via Categories

**Threat**: If only one employee works in department X, and a "workplace concern" submission references department X issues, the submitter is identifiable.

**Mitigation**: Categories are broad (5 options) and not department-specific. Impact levels are generic. No department or team identifiers are captured.

**Residual Risk**: Feedback content (once decrypted by admin) may contain self-identifying information. This is a user behavior risk, not a system risk. Mitigation: UI guidance reminding users not to include identifying details.

## Security Boundaries

```
┌─────────────────────────────────────────────────────┐
│                 TRUSTED ZONE                         │
│          (User's Browser - single tab)              │
│                                                     │
│  Plaintext ─── Encryption ─── Ciphertext            │
│  Private Key (admin only) ─── Decryption            │
│  Receipt Token (sessionStorage)                     │
└─────────────────────────┬───────────────────────────┘
                          │ TLS 1.3
┌─────────────────────────┴───────────────────────────┐
│              UNTRUSTED ZONE                          │
│            (Server + Database)                       │
│                                                     │
│  Sees: ciphertext, receipt hash, category, impact   │
│  Cannot see: plaintext, token, private key, IP, UA  │
└─────────────────────────────────────────────────────┘
```

## Summary of Defense Layers

| Layer | Protection |
|-------|-----------|
| Encryption | AES-256-GCM + RSA-OAEP 4096-bit |
| Metadata Purging | Strip all identifying headers, override IP to 0.0.0.0 |
| Timestamp Bucketing | DATE only (24-hour anonymity windows) |
| Session Isolation | sessionStorage only, SHA-256 hashed tokens |
| No Identity System | Zero accounts, cookies, JWTs, or persistent IDs |
| Transport Security | TLS 1.3 (defense in depth — content already encrypted) |
| Dependency Security | npm audit, pip-audit, GitLeaks, Bandit |
