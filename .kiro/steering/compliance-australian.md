# Australian Compliance Requirements

## Australian Privacy Act 1988 (APPs)

### APP 1 — Open & Transparent Management
- Application MUST have a publicly accessible Privacy Policy page
- Privacy Policy MUST describe what data is collected, why, who can access it, and retention period
- Privacy Policy MUST be accessible from the application footer on all pages

### APP 3 — Collection of Solicited Information
- Only collect information reasonably necessary for the feedback function
- Collected: encrypted feedback content, category, impact level, submission date
- NOT collected: names, emails, IP addresses, browser fingerprints, timestamps with time precision

### APP 5 — Notification of Collection
- Display a Privacy Collection Notice before first submission
- Notice MUST explain: what's collected, why, who receives it, retention period, rights

### APP 6 — Use & Disclosure
- Data used ONLY for anonymous employee feedback review
- Never shared with third parties
- Never used for employee identification or performance management

### APP 8 — Cross-border Disclosure
- Application MUST be hosted in Australia (data sovereignty)
- Document hosting region in deployment configuration
- No data transfers outside AU without explicit consent

### APP 11 — Security of Personal Information
- AES-256-GCM encryption for all feedback content
- RSA-OAEP 4096-bit key wrapping
- Zero-knowledge architecture — server cannot decrypt
- Annual penetration testing requirement

### APP 11.2 — Destruction / De-identification
- Configurable data retention period (default: 12 months after resolution)
- Automated deletion of resolved submissions past retention period
- Hard delete (not soft-delete) — data is unrecoverable after purge

### APP 12 — Access to Personal Information
- Employees can check submission status during active session
- Withdrawal within 24 hours of submission

### APP 13 — Correction
- Technical limitation: encrypted content cannot be edited server-side
- Document: "Submit a new feedback to provide corrections"

## Notifiable Data Breaches (NDB) Scheme
- Data breach notification procedure documented
- 72-hour notification commitment to affected individuals
- OAIC notification template prepared
- Breach response runbook in docs/

## Essential Eight Alignment
- E8-1: Application control via container image signing
- E8-2: Patch management with automated dependency updates
- E8-4: Security headers (CSP, HSTS, X-Frame-Options)
- E8-5: Restrict admin privileges (token + MFA)
- E8-7: Multi-factor authentication for admin
- E8-8: Regular encrypted backups with tested restore

## State-specific Considerations
- Victoria: Health Records Act compliance if used in healthcare
- NSW: Privacy & Personal Information Protection Act alignment
- Queensland: Information Privacy Act 2009 alignment
- All states: Consistent with federal Privacy Act which takes precedence
