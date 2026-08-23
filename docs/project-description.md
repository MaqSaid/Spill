# Spill — Project Description

## Problem Being Addressed

Traditional employee feedback tools (anonymous surveys, suggestion boxes, HR platforms) all share a fundamental trust problem: employees must believe that the company cannot trace their feedback back to them. In reality, these systems store plaintext responses, log IP addresses, track session cookies, and record timestamps — all of which create correlation vectors that can de-anonymize submissions.

Employees who fear retaliation often self-censor or avoid feedback systems entirely, depriving organizations of honest input about workplace issues, leadership concerns, and improvement opportunities.

## Proposed Solution

Spill is a **zero-knowledge anonymous feedback platform** where the server is cryptographically incapable of reading submitted feedback. All encryption happens in the employee's browser using the Web Crypto API — the server receives and stores only ciphertext. Even a fully compromised server cannot expose feedback content.

The system implements defense-in-depth anonymity:
- Client-side AES-256-GCM encryption with RSA-OAEP key wrapping
- Metadata purging middleware (strips IP, User-Agent, all identifying headers)
- Timestamp bucketing (date-only storage prevents timing correlation)
- Ephemeral session tokens (sessionStorage only — destroyed on tab close)
- No accounts, cookies, or persistent identifiers of any kind

## Key Features

1. **Zero-Knowledge Encryption**: Feedback encrypted in the browser with AES-256-GCM before network transit. Server stores only ciphertext — cannot decrypt.

2. **Complete Anonymity**: No user accounts, no IP logging, no cookies, no User-Agent tracking. MetadataPurgingMiddleware overrides all client IPs to 0.0.0.0.

3. **Session-Based Status Tracking**: Employees can check their submission status during the active browser session without any identity linkage. Closing the tab permanently erases the session.

4. **Admin Decryption Portal**: Managers decrypt feedback client-side using their RSA private key (which never touches the server). Status updates follow an enforced state machine.

5. **Hexagonal Architecture**: Clean separation between domain logic and infrastructure. Core business rules have zero framework dependencies, enabling comprehensive testing with simple mocks.

6. **Security-First Design**: Rate limiting, timestamp bucketing, state machine enforcement, property-based testing with Hypothesis, and a documented threat model covering 10 attack vectors.

7. **Kiro-Powered Development**: Built using Kiro's spec-driven workflow (requirements → design → tasks), 24 steering files for consistent standards, 20 agent hooks for automated security and quality enforcement, and 4 custom skills for repeatable workflows.

## How Spill Differs from Existing Solutions

| Tool | Plaintext on Server | IP Logging | User Accounts | True Anonymity |
|------|---|---|---|---|
| Google Forms | Yes | Yes | Optional | No |
| SurveyMonkey | Yes | Yes | Yes | No |
| Officevibe / Lattice | Yes | Yes | Yes | No |
| Slack anonymous bots | Yes | Yes | Via Slack | No |
| **Spill** | **No (ciphertext only)** | **No (purged)** | **None** | **Yes** |

Existing tools promise "anonymity" through policy (access controls, HR promises). Spill guarantees it through **cryptography** — even a malicious admin with full database access sees only ciphertext.

## Future Roadmap

1. **Key Rotation**: Periodic RSA key rotation with re-encryption of active submissions
2. **Multi-Organization Support**: Separate key pairs per department/team with isolation
3. **Encrypted Categories**: Move category metadata into the encrypted payload for maximum privacy
4. **Threshold Decryption**: Require M-of-N managers to collaborate for decryption (Shamir's Secret Sharing)
5. **Federated Deployment**: On-premise deployment toolkit for organizations with strict data residency requirements
6. **Anonymous Replies**: Allow managers to respond to feedback without knowing who submitted it (bidirectional anonymous communication)
7. **Audit Log**: Tamper-evident log of admin decryption events (who decrypted, when) without revealing content

