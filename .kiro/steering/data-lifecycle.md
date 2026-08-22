# Data Lifecycle Management

## Retention Policy

### Configurable Retention
- Environment variable: `SPILL_RETENTION_DAYS` (default: 365)
- Only submissions with status `RESOLVED` are eligible for auto-deletion
- Active submissions (SUBMITTED, UNDER_REVIEW, IN_PROGRESS) are NEVER auto-deleted
- Clock starts from `submitted_date`

### Automated Cleanup
- Cleanup task runs daily (background async task on app startup)
- Deletes: all RESOLVED submissions where submitted_date < (today - RETENTION_DAYS)
- Hard delete (not soft-delete) — data is permanently removed
- Log: count of deleted rows only (never content or identifiers)

## Employee Withdrawal (Right to Erasure)

### Rules
- Employees can withdraw submissions within 24 hours of submission
- Endpoint: `DELETE /api/v1/submissions/{id}`
- Requires: correct `receipt_hash` in request body (proves ownership)
- After 24 hours: returns 410 Gone ("Withdrawal period expired")
- Withdrawal is permanent — data cannot be recovered

### Constraints
- Only the original submitter (holder of receipt_hash) can request withdrawal
- Cannot withdraw submissions already moved to IN_PROGRESS or RESOLVED
- No partial withdrawal — entire submission is deleted

## Backup Strategy

### Requirements
- Daily automated backups of PostgreSQL database
- Backups encrypted at rest (AES-256 or hosting provider encryption)
- Backup retention: 90 days
- Tested restore procedure documented in deployment runbook
- Backups stored in separate region/account from live data

### What NOT to backup
- Session tokens (ephemeral, not valuable)
- Rate limiter state (in-memory, reconstructs on restart)

## Key Rotation

### RSA Key Pair Rotation
- Store `key_version` with each submission (tracks which public key was used)
- When rotating: new submissions use new key, old submissions still decrypt with old key
- Old private key retained until all submissions under that version are resolved + purged
- Document rotation procedure in deployment runbook

### Admin Token Rotation
- Rotate admin token quarterly (or immediately if compromise suspected)
- Update `SPILL_ADMIN_TOKEN_HASH` environment variable
- All existing admin sessions invalidated on rotation

## Data Classification

| Data Element | Classification | Retention |
|-------------|---------------|-----------|
| encrypted_payload | CONFIDENTIAL (encrypted) | Until resolved + retention period |
| encryption_iv | CONFIDENTIAL (crypto material) | Same as payload |
| encrypted_symmetric_key | CONFIDENTIAL (crypto material) | Same as payload |
| receipt_hash | INTERNAL (pseudonymous) | Same as payload |
| category | INTERNAL (metadata) | Same as payload |
| impact | INTERNAL (metadata) | Same as payload |
| status | INTERNAL (operational) | Same as payload |
| submitted_date | INTERNAL (metadata) | Same as payload |
| status_note | INTERNAL (admin notes) | Same as payload |
| audit_log entries | INTERNAL (operational) | 2 years |
