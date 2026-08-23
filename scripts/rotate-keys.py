#!/usr/bin/env python3
"""
Spill Key Rotation Script

Generates a new RSA-4096 key pair and updates backend/.env with the new public key.
The old private key should be retained until all old submissions are resolved.

Usage:
    python scripts/rotate-keys.py

Output:
    - Updates SPILL_ORG_PUBLIC_KEY in backend/.env
    - Saves new private key to spill_private_key.pem (overwrites!)
    - Prints instructions for admin

WARNING: After rotation, submissions encrypted with the OLD key can only be
         decrypted with the OLD private key. Keep old keys until all old
         submissions are resolved/deleted.
"""

from __future__ import annotations

import sys
from pathlib import Path

try:
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization
except ImportError:
    print("ERROR: 'cryptography' package not installed.")
    print("Run: pip install cryptography")
    sys.exit(1)


def main() -> None:
    project_root = Path(__file__).resolve().parent.parent
    env_path = project_root / "backend" / ".env"
    private_key_path = project_root / "spill_private_key.pem"

    print("=" * 50)
    print("  SPILL KEY ROTATION")
    print("=" * 50)
    print()

    # Confirm
    if private_key_path.exists():
        print(f"WARNING: {private_key_path} already exists.")
        print("The old private key will be OVERWRITTEN.")
        print("If you have unresolved submissions encrypted with the old key,")
        print("back up the old key first!")
        print()
        response = input("Continue? (yes/no): ").strip().lower()
        if response != "yes":
            print("Aborted.")
            sys.exit(0)

    # Generate key pair
    print("\nGenerating RSA-4096 key pair...")
    key = rsa.generate_private_key(public_exponent=65537, key_size=4096)

    priv_pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode()

    pub_pem = key.public_key().public_bytes(
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()

    # Save private key
    private_key_path.write_text(priv_pem)
    print(f"Private key saved: {private_key_path}")

    # Update .env with single-line public key
    pub_single_line = pub_pem.strip().replace("\n", "\\n")
    env_line = f'SPILL_ORG_PUBLIC_KEY="{pub_single_line}"'

    if env_path.exists():
        # Replace existing SPILL_ORG_PUBLIC_KEY line
        lines = env_path.read_text().splitlines()
        new_lines = []
        replaced = False
        for line in lines:
            if line.startswith("SPILL_ORG_PUBLIC_KEY"):
                new_lines.append(env_line)
                replaced = True
            else:
                new_lines.append(line)
        if not replaced:
            new_lines.append(env_line)
        env_path.write_text("\n".join(new_lines) + "\n")
    else:
        env_path.write_text(env_line + "\n")

    print(f"Public key updated in: {env_path}")

    print("\n" + "=" * 50)
    print("  DONE")
    print("=" * 50)
    print()
    print("Next steps:")
    print("  1. Restart backend: docker compose restart backend")
    print("  2. Give the private key file to the admin")
    print(f"     File: {private_key_path}")
    print("  3. New submissions will use the new key")
    print("  4. Old submissions still need the OLD private key to decrypt")
    print()


if __name__ == "__main__":
    main()
