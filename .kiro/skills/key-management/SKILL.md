---
name: key-management
description: Generate, configure, and manage RSA key pairs for Spill encryption. Use when asked to generate keys, set up encryption, configure public key, rotate keys, or troubleshoot key-related issues.
---

## Key Management

Manage RSA-4096 key pairs for the Spill zero-knowledge encryption system.

### Generate a Fresh Key Pair

Use Python cryptography library (available in the backend venv):
```python
python -c "
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

key = rsa.generate_private_key(public_exponent=65537, key_size=4096)

priv_pem = key.private_bytes(
    serialization.Encoding.PEM,
    serialization.PrivateFormat.PKCS8,
    serialization.NoEncryption()
).decode()

pub_pem = key.public_key().public_bytes(
    serialization.Encoding.PEM,
    serialization.PublicFormat.SubjectPublicKeyInfo
).decode()

open('spill_private_key.pem', 'w').write(priv_pem)
open('spill_public_key.pem', 'w').write(pub_pem)
print('Keys generated successfully')
"
```

### Configure Public Key in Backend

The public key goes in `backend/.env` as a single-line value with escaped newlines:
```
SPILL_ORG_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIC...\n-----END PUBLIC KEY-----"
```

The backend `/api/v1/public-key` endpoint converts `\n` back to real newlines when serving to the frontend.

### Key Distribution

| Key | Who Has It | Where Stored | Purpose |
|-----|-----------|--------------|---------|
| Public Key | Everyone (via API) | `backend/.env` as `SPILL_ORG_PUBLIC_KEY` | Encrypt submissions |
| Private Key | Admin only | Admin's local machine (never on server) | Decrypt in browser |

### Security Rules
- Private key NEVER goes in `.env`, git, or any server
- `.gitignore` excludes `*.pem` files
- Public key is NOT secret (by design — asymmetric encryption)
- If private key is lost, existing submissions are permanently unreadable
- Back up private key securely (encrypted USB, password manager)

### Key Rotation
When rotating keys:
1. Generate new pair
2. Update `SPILL_ORG_PUBLIC_KEY` in `.env`
3. Restart backend (`docker compose restart backend`)
4. New submissions encrypt with new key
5. Keep old private key until all old submissions are resolved + purged
6. Future: store `key_version` per submission for multi-key support

### Admin Private Key Upload (File Picker)

The Admin Dashboard uses a **file picker** (not paste) for loading the private key:

1. Admin clicks "Choose .pem File" button
2. Browser native file dialog opens
3. Admin selects their `spill_private_key.pem` file from disk
4. File is validated client-side:
   - Max 16KB file size
   - Accepted extensions: `.pem`, `.key`, `.txt`
   - Must contain `-----BEGIN PRIVATE KEY-----` header
   - Must contain `-----END PRIVATE KEY-----` footer
   - Must successfully import via Web Crypto API (RSA-OAEP)
5. Key stays in browser memory (React state) — never sent to server
6. Key is lost when tab closes or admin clicks "Clear Key"

**Why file picker over paste:**
- More accessible for non-technical HR staff
- Avoids copy-paste errors with long PEM strings
- Familiar OS-native UI pattern
- No risk of accidentally pasting into wrong field
- File is read locally via FileReader API — zero network transfer

### Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Frontend shows "Encryption key not configured" | Public key not in `.env` or endpoint returns 404 | Set `SPILL_ORG_PUBLIC_KEY` and restart backend |
| Admin can't decrypt | Wrong private key or key mismatch | Verify key pair matches (generated together) |
| Docker parse error on `.env` | Multiline PEM format | Convert to single-line with `\n` escapes |
| "Failed to import private key" | Wrong format (needs PKCS#8) | Ensure key starts with `-----BEGIN PRIVATE KEY-----` |
