# ADR-002: Zero-Knowledge Client-Side Encryption

## Status

Accepted

## Context

Employee feedback systems typically store plaintext content on the server. This creates a trust problem: employees must trust that administrators, database engineers, and attackers who compromise the server cannot read their submissions. Traditional access controls are insufficient for truly anonymous feedback.

## Decision

Implement a zero-knowledge architecture where:

- All encryption/decryption happens exclusively in the browser using the Web Crypto API
- The server receives only ciphertext (AES-256-GCM encrypted payloads)
- The server has no capability to decrypt — it lacks the private key
- Only authorized managers holding the RSA private key can decrypt, and they do so client-side

Encryption scheme:
- **Symmetric**: AES-256-GCM with a fresh random key per submission
- **Asymmetric**: RSA-OAEP (4096-bit, SHA-256) for wrapping the AES key
- **Randomness**: `crypto.getRandomValues()` (CSPRNG)

## Consequences

- **Positive**: Server compromise does not expose feedback content. Even a malicious administrator with database access sees only ciphertext.
- **Positive**: No need for complex server-side key management or HSMs.
- **Negative**: If the RSA private key is lost, all existing submissions become permanently unreadable.
- **Negative**: Server cannot perform search, analytics, or categorization on feedback content.
- **Accepted tradeoff**: The privacy guarantee is the product's core value proposition, outweighing server-side analytics capabilities.
