# Incident Response Procedure — Spill

## Data Breach Notification (NDB Scheme)

### Timeline
- **0-24 hours**: Assess and contain the breach
- **24-48 hours**: Notify affected individuals if eligible
- **72 hours maximum**: Notify the OAIC (Office of the Australian Information Commissioner)

### Assessment Criteria
A notifiable data breach occurs when:
1. There is unauthorized access or disclosure of personal information
2. A reasonable person would conclude serious harm could result
3. The organization has not been able to prevent the risk of harm through remedial action

### For Spill Specifically
Due to zero-knowledge encryption:
- **Encrypted payload breach**: NOT notifiable (attacker cannot decrypt without private key)
- **Metadata breach** (categories, dates, statuses): Assess if combination reveals identity
- **Admin credential breach**: Notify immediately, rotate tokens, revoke all sessions
- **Private key breach**: CRITICAL — re-encrypt all submissions with new key pair

### Containment Steps
1. Activate maintenance mode: `SPILL_MAINTENANCE=true`
2. Rotate admin token: generate new hash, update `SPILL_ADMIN_TOKEN_HASH`
3. Rotate TOTP secret: generate new secret, issue new QR code to admin
4. Invalidate all sessions (restart backend process)
5. Review audit logs for unauthorized access patterns
6. If private key compromised: notify all employees, generate new key pair

### OAIC Notification Template

**Organization**: [Company Name]
**Contact**: [Privacy Officer email]
**Date aware**: [Date breach discovered]
**Description**: [Brief description]
**Information involved**: Encrypted employee feedback metadata (categories, impact levels, submission dates). Feedback content remains encrypted and unreadable without the RSA private key.
**Steps taken**: [Containment actions]
**Recommendations**: [What affected individuals should do]

### Post-Incident
- Conduct root cause analysis
- Update threat model
- Implement additional controls
- Document lessons learned
- Schedule follow-up audit within 30 days
