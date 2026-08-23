# Spill — Demo Pitch (STAR Method)

> **Demo Video:** [https://youtu.be/IxtZ-jgAjO0](https://youtu.be/IxtZ-jgAjO0)

> For judges: This document narrates every screen of the application, explains how each maps to the competition rubric, and highlights what differentiates Spill from existing solutions.

---

## S — SITUATION

### The Problem (Why This Matters)

73% of employees self-censor workplace feedback. Not because they have nothing to say — but because they don't trust the tools.

Every existing "anonymous" feedback platform has the same flaw:

| Tool | What It Actually Does | True Anonymity? |
|------|----------------------|:---:|
| Google Forms | Stores plaintext, logs IP, optional login | No |
| SurveyMonkey | Stores plaintext, requires account, tracks sessions | No |
| Officevibe / Lattice | Stores plaintext, identity-linked, HR has full access | No |
| Slack anonymous bots | Routes through Slack (identity known to Slack) | No |

These tools promise anonymity through **policy** ("we won't look"). Spill guarantees it through **cryptography** ("we physically cannot look").

### The Real-World Impact

- Employees who fear retaliation stay silent
- Organizations lose honest signal about leadership, culture, safety
- Workplace issues escalate because early warnings were suppressed
- Legal exposure increases (Australian Privacy Act, workplace health obligations)

---

## T — TASK

### What We Built

A zero-knowledge anonymous feedback platform with these constraints:

1. Server **cryptographically cannot** read feedback (not just "won't")
2. No accounts, no login, no cookies, no IP logging, no User-Agent
3. MFA-protected admin portal with client-side-only decryption
4. Australian Privacy Act compliant (APPs 1-13)
5. Production-grade: rate limiting, security headers, state machine, health checks
6. WCAG 2.0 AA accessible
7. Fully self-hosted, $0 cost, runs with `docker-compose up`

### How Kiro Made This Possible

| Kiro Feature | How It Was Used | Impact |
|-------------|-----------------|--------|
| Specs | requirements.md (9 FR + 12 NFR) → design.md → 32 tasks | Zero scope creep, every feature traces to a requirement |
| 24 Steering Files | Security, architecture, compliance enforced on every AI interaction | AI never generated code violating zero-knowledge principles |
| 20 Agent Hooks | Auto-check privacy, accessibility, secrets, code quality on save | Caught 3 potential privacy violations during development |
| 4 Custom Skills | full-test-suite, docker-rebuild, security-audit, key-management | Repeatable workflows, consistent quality |
| Sub-agents | context-gatherer for codebase analysis, semantic_reviewer for review | Deep understanding before changes |

---

## A — ACTION: EMPLOYEE FLOW

### Screen 1: Landing Page (Submit Feedback)

**What the judge sees:**
- Clean mobile-first interface with prominent trust banners
- "100% Confidential — Cryptographically Guaranteed" (collapsible, open by default)
- "Your Employment is Protected" (Australian workplace law reference)
- "How does this work?" expandable section explaining the encryption in plain language
- No login, no account creation, no cookies notice

**Rubric criteria addressed:**

| Criterion | Points | Evidence |
|-----------|--------|----------|
| Real-World Value | 15 | Solves genuine employee fear with technical + UX guarantees |
| Functionality | 15 | Trust UX designed for Gen Z workforce, plain language over crypto jargon |
| Innovation | 8 | No other tool combines zero-knowledge with employee-first trust design |

**Differentiator:** Every other feedback tool shows a blank form. Spill shows three trust banners BEFORE the form — acknowledging that giving feedback feels vulnerable and addressing it head-on.

---

### Screen 2: Category & Impact Selection

**What the judge sees:**
- 5 categories with icons (Idea, Complaint, Suggestion, Positive, Workplace Concern)
- 4 impact levels (Low, Medium, High, Critical)
- Submit button disabled until all fields complete
- Visual pressed/selected states with accessibility `aria-pressed`

**Rubric criteria addressed:**

| Criterion | Points | Evidence |
|-----------|--------|----------|
| Functionality | 15 | Complete form validation, disabled state until ready |
| Code Quality | 10 | WCAG 2.0: aria-pressed, 44px touch targets, keyboard navigable |

**Differentiator:** Structured categories allow admin to triage without reading content. Impact levels enable SLA tracking (critical submissions flagged if unresolved > 7 days).

---

### Screen 3: Feedback Text + Encryption Indicator

**What the judge sees:**
- Textarea with placeholder "Share your thoughts honestly..."
- Real-time encryption indicator below the textarea showing status
- Indicator changes from "Waiting for content..." to "Ready to encrypt"

**Rubric criteria addressed:**

| Criterion | Points | Evidence |
|-----------|--------|----------|
| Innovation | 8 | Live visual feedback that encryption is active — builds trust |
| Code Quality | 10 | Web Crypto API (browser-native, not npm package — zero supply chain risk) |

**Differentiator:** The encryption indicator is a trust signal — employees SEE that their text will be encrypted. No other tool provides this transparency.

---

### Screen 4: Submit + Confirmation Modal

**What the judge sees:**
- Modal with two reassurances: "Your identity is cryptographically protected" + "Cannot be modified after sending"
- Cancel button has focus first (prevents accidental submission)
- Two buttons: [Cancel] [Submit Anonymously]

**Rubric criteria addressed:**

| Criterion | Points | Evidence |
|-----------|--------|----------|
| Real-World Value | 15 | Acknowledges submission is irreversible, gives control back |
| Functionality | 15 | Cancel-first focus (WCAG best practice for destructive actions) |
| Originality | 7 | Two-step submission with privacy reassurance in modal |

**Differentiator:** The modal doesn't just say "Are you sure?" — it reiterates the privacy guarantee at the moment of maximum anxiety.

---

### Screen 5: Success + Submission ID

**What the judge sees:**
- Green confirmation card with checkmark
- Submission reference ID (ULID format)
- "Check 'My Status' to track or withdraw within 24 hours"
- "Submit Another" button

**Rubric criteria addressed:**

| Criterion | Points | Evidence |
|-----------|--------|----------|
| Functionality | 15 | Complete lifecycle: submit → track → withdraw (within 24h) |
| Innovation | 8 | ULID IDs (sortable, no coordination, collision-resistant) |

**Differentiator:** Employee gets a receipt. They can track status AND withdraw within 24 hours — giving them control even after submission.

---

### Screen 6: My Status Tab

**What the judge sees:**
- List of submissions made in this session
- Status badges: Submitted (blue), Under Review (yellow), In Progress (purple), Resolved (green)
- "Withdraw this submission" link on unresolved items
- "Closing this tab clears your session token" warning

**Rubric criteria addressed:**

| Criterion | Points | Evidence |
|-----------|--------|----------|
| Originality | 7 | Anonymous status tracking via ephemeral session token |
| Innovation | 8 | SHA-256(sessionToken) as receipt — server never sees raw token |
| Functionality | 15 | Withdrawal rights, real-time status updates from admin |

**Differentiator:** Employees get a feedback loop WITHOUT identity exposure. They know their concern is being addressed — maintaining trust in the system.

**Privacy guarantee:** Each browser tab gets a unique 128-bit random token. Other employees cannot see each other's submissions (different tokens, different SHA-256 hashes). Closing the tab destroys access permanently.

---

## A — ACTION: ADMIN FLOW

### Screen 7: Admin Login (MFA Gate)

**What the judge sees:**
- Clean login form: Admin Token (password field) + Authenticator Code (6-digit numeric)
- "Two-factor authentication required" subtitle
- "Session expires after 8 hours or when you close this tab"

**Rubric criteria addressed:**

| Criterion | Points | Evidence |
|-----------|--------|----------|
| Code Quality | 10 | SHA-256 timing-safe comparison (hmac.compare_digest) |
| Functionality | 15 | Full MFA: token (something you know) + TOTP (something you have) |
| Innovation | 8 | 5-attempt lockout with 15-minute cooldown |

**Differentiator:** This is production-grade authentication — not a demo shortcut. Token hash + TOTP + lockout + session TTL + idle timeout. Same security model used by banks.

---

### Screen 8: Admin Dashboard (Encrypted Submissions)

**What the judge sees:**
- Submissions list with category, impact, status badges, dates
- Each submission shows "Load private key to decrypt" (greyed out)
- File picker section: "Upload your private key to read submissions"
- Blue info banner explaining the process

**Rubric criteria addressed:**

| Criterion | Points | Evidence |
|-----------|--------|----------|
| Innovation | 8 | Admin sees metadata but NOT content — zero-knowledge proven visually |
| Real-World Value | 15 | Even a compromised server/admin account reveals only ciphertext |
| Originality | 7 | Private key upload via file picker — never paste, never server |

**Differentiator:** This screen PROVES zero-knowledge to the judge. Submissions exist, but content is unreadable. The server held this data but could never read it. Only the private key holder — sitting at this browser — can decrypt.

---

### Screen 9: Private Key File Upload

**What the judge sees:**
- Drag-drop style dashed border area with key icon
- "Choose .pem File" button (native file picker)
- "Accepts .pem, .key, or .txt files (max 16KB)" helper text

**Rubric criteria addressed:**

| Criterion | Points | Evidence |
|-----------|--------|----------|
| Functionality | 15 | File picker with 5 validations (size, extension, PEM markers, crypto import) |
| Code Quality | 10 | FileReader API — file never leaves browser, never uploaded |
| Real-World Value | 15 | Accessible for non-technical HR staff (no copy-paste of PEM text) |

**Differentiator:** The private key is read locally via the browser's FileReader API. It's imported into Web Crypto as a non-extractable CryptoKey object. It exists only in browser memory and is cleared when the tab closes or admin clicks "Clear Key."

---

### Screen 10: Key Loaded — Ready to Decrypt

**What the judge sees:**
- Green success banner: "Private key loaded from spill_private_key.pem — ready to decrypt"
- Shield icon
- "Clear Key" button for explicit removal
- Submission cards now show "Click to decrypt" (active, clickable)

**Rubric criteria addressed:**

| Criterion | Points | Evidence |
|-----------|--------|----------|
| Code Quality | 10 | CryptoKey object in memory, clear UX feedback, explicit removal option |

---

### Screen 11: Decrypting a Submission

**What the judge sees:**
- Click "Click to decrypt" → plaintext feedback appears in the card
- Decrypted text shown in a grey background box
- The original employee feedback is now readable

**Rubric criteria addressed:**

| Criterion | Points | Evidence |
|-----------|--------|----------|
| Innovation | 8 | RSA-OAEP unwraps AES key → AES-GCM decrypts → plaintext in React state only |
| Originality | 7 | Decrypted text is NEVER sent back to server — exists only in browser |
| Functionality | 15 | Full end-to-end working: encrypt (employee) → store (server) → decrypt (admin) |

**Differentiator:** This is the moment that proves the architecture works. The feedback was encrypted by an anonymous employee, stored as ciphertext the server couldn't read, and now decrypted by the authorized admin — all client-side, all cryptographically sound.

---

### Screen 12: Status Update

**What the judge sees:**
- Status buttons below each submission: "Under Review", "In Progress", "Resolved"
- Click "Under Review" → badge changes from blue "submitted" to yellow "under review"

**Rubric criteria addressed:**

| Criterion | Points | Evidence |
|-----------|--------|----------|
| Functionality | 15 | State machine enforced (no backward transitions, no skipping) |
| Code Quality | 10 | Domain entity validates transitions (core has zero framework imports) |

---

### Screen 13: Employee Sees Status Change

**What the judge sees:**
- Switch back to employee browser tab
- Click Refresh → status badge changed from "Submitted" to "Under Review"
- The feedback loop is complete — anonymously

**Rubric criteria addressed:**

| Criterion | Points | Evidence |
|-----------|--------|----------|
| Real-World Value | 15 | Anonymous feedback loop closed — employee knows action was taken |
| Originality | 7 | Bidirectional communication without identity exposure |

**Differentiator:** This is the complete circle. Employee submitted anonymously → admin read and acted → employee sees the response — all without any party knowing who the other is. No other tool achieves this.

---

## R — RESULT

### Technical Results

| Metric | Result |
|--------|--------|
| Readiness Score | 72/72 checks passed (100%) |
| Backend Tests | 55 passed (unit + integration + property-based) |
| Frontend Tests | 22 passed (encryption, session, round-trip) |
| TypeScript | Strict mode, 0 errors |
| Python Linter | Ruff — all checks passed |
| npm Vulnerabilities | 0 (after audit fix) |
| Security Headers | All 8 required headers present |
| API Error Handling | 422 validation (no stack traces), 401 generic auth errors |
| Docker | 3 containers, all healthy, boots in 30 seconds |
| Cost | $0 — fully self-hosted, all open source |

### Kiro Results

| Feature | Count | Impact |
|---------|-------|--------|
| Spec Tasks | 32/32 complete | Zero scope creep |
| Steering Files | 24 | Security + architecture enforced on every interaction |
| Agent Hooks | 20 | Auto-validation on every file save |
| Custom Skills | 4 | Repeatable workflows |
| ADRs | 6 | Architectural decisions documented |
| Documentation | 10 docs | Threat model, incident response, deployment runbook |

### What Makes This Different

1. **Not a survey tool** — it's a cryptographic privacy system that happens to collect feedback
2. **Not "anonymous by policy"** — it's anonymous by mathematics (AES-256-GCM + RSA-OAEP 4096-bit)
3. **Not a demo** — it has production-grade MFA, rate limiting, security headers, state machine, health checks
4. **Not expensive** — $0 cost, runs on `docker-compose up`, no external APIs
5. **Not just code** — it has a documented threat model, incident response procedure, and Australian compliance

### The Kiro Difference

Without Kiro's steering files, the AI would have:
- Generated code that logs plaintext feedback (steering: security.md prevents this)
- Used localStorage (steering: security.md enforces sessionStorage only)
- Put framework imports in core domain (steering: architecture.md prevents this)
- Skipped accessibility (hook: accessibility-check.json catches it on every save)
- Committed secrets (hook: validate-no-secrets.json blocks it)

The 24 steering files + 20 hooks create an automated compliance layer that makes it **impossible** to accidentally violate the zero-knowledge guarantee during development.

---

## Quick Reference for Judges

| What to Evaluate | Where to Find It |
|-----------------|-----------------|
| Run the app | `docker-compose up` then open http://localhost:5173 |
| Admin login | Token + TOTP (see README Test Credentials) |
| Private key | `spill_private_key.pem` in project root |
| Architecture | README.md Architecture section |
| Security model | README.md Security Model table + docs/threat-model.md |
| Kiro usage | docs/kiro-usage.md (detailed narrative) |
| Requirements | .kiro/specs/requirements.md |
| Design | .kiro/specs/design.md |
| All 32 tasks | .kiro/specs/tasks.md |
| Steering files | .kiro/steering/ (24 files) |
| Agent hooks | .kiro/hooks/ (20 files) |
| Custom skills | .kiro/skills/ (4 skills) |
| Tests | `cd backend && pytest -q` / `cd frontend && npx vitest run` |
| Readiness check | `powershell scripts/check-submission-readiness.ps1` |
