# Employee Trust UX Guidelines

## Core Principle
Employees must feel 100% confident that:
1. Their feedback is completely confidential
2. They will NOT be disciplined for any feedback
3. They will NOT be removed from employment
4. No one can trace submissions back to them
5. The system is designed to make identification technically impossible

## Required Trust Signals on Submit Page

### Confidentiality Disclaimer (MUST be visible before form)
Display a prominent disclaimer stating:
- "This platform guarantees your anonymity through military-grade encryption"
- "Your employer CANNOT identify who submitted feedback"
- "You will NOT face any disciplinary action for honest feedback"
- "Submissions cannot be traced to any individual — this is a technical guarantee, not just a policy"

### How It Works (Expandable Help Section)
Include a "How does this work?" expandable section explaining:
- Your feedback is encrypted IN YOUR BROWSER before being sent
- The server only stores encrypted data it cannot read
- No IP address, browser info, or identity is stored
- Only the HR manager with the decryption key can read content — and they cannot see who sent it
- Your session data is destroyed when you close the browser tab

### Help Link
- Include a visible "Need Help?" or "Learn More" link
- Links to an explanation page about how the encryption works
- Reassures employees about the technical guarantees

### Employment Protection Notice
- "Australian workplace law protects employees who provide honest feedback"
- "This platform is designed so that identification is technically impossible"
- "Your organization has committed to a no-retaliation policy for anonymous feedback"

## Submit Button Behavior
- Button MUST be disabled until ALL required fields are selected/entered:
  - Category selected
  - Impact level selected
  - Feedback text non-empty
  - Public key loaded successfully
- Visual disabled state must be clearly distinguishable (opacity, cursor)
- On click: show confirmation modal before submission

## Confirmation Modal Content
- Reiterate: "Your feedback cannot be modified after submission"
- Reiterate: "No one can identify you — this is cryptographically guaranteed"
- Two buttons: [Cancel] [Submit Anonymously]
- Cancel button gets focus first (prevent accidental submit)

## No PEM Visibility
- Employees should NEVER see encryption keys, PEM data, or cryptographic details
- All encryption is transparent and automatic
- The only visible indicator is the encryption status component

## Tone
- Warm, reassuring, supportive
- Avoid legal jargon — use plain language
- Acknowledge that giving feedback can feel vulnerable
- Emphasize the technical impossibility of identification (not just a promise)
