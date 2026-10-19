# Security Policy & Vulnerability Reporting

StockSense takes software security, data integrity, and inventory ledger reliability seriously.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Architecture & Invariants

1. **Strict Temporal Integrity & Zero-Leakage**: Demand extractors strictly exclude stock movements occurring after the analysis cutoff date to ensure uncompromised forecasting models without future information leakage.
2. **Immutable Double-Entry Ledger**: Stock balance updates enforce non-negative constraints at the database engine level with atomic row updates (`CHECK (quantity_on_hand >= 0)`). Direct database mutations are strictly audited against `stock_movements`.
3. **Idempotency Guarantees**: Stock receipt, transfer, and PO fulfillment endpoints verify client idempotency keys (`idempotency_key`), returning `409 Conflict` on parameter divergence to prevent duplicate processing.
4. **Attachment Security**: File uploads enforce strict extension allowlists (`.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`), MIME validation, binary magic-byte inspection, a 10 MB file size cap, and strict traversal protection restricting all reads to the designated `ATTACHMENTS_DIR`.
5. **Authentication & Strict Token Validation**: Protected API endpoints enforce Bearer JWT authentication with bcrypt password hashing (`rounds=12`). Unauthenticated session fallbacks are prohibited, ensuring explicit identity verification on `/api/v1/auth/me` and `/api/v1/users/me`.
6. **Administrative & Destructive Action RBAC**: Workspace initialization and dataset resets (`POST /api/v1/workspace/init-clean` and `POST /api/v1/workspace/restore-demo`) require `ADMIN` or `MANAGER` role authorization.
7. **Privilege Escalation Defense**: Self-registration with `ADMIN` privileges is blocked. Account provisioning with `role: "ADMIN"` strictly requires an active, authenticated administrator session.
8. **Production Secret Hardening**: When running with `ENVIRONMENT=production`, the application runtime strictly halts if the fallback development `SECRET_KEY` is detected, requiring a unique, cryptographically random key ($\ge 32$ characters).

## Reporting a Vulnerability

If you discover a security vulnerability or ledger integrity issue, please report it privately:

- **GitHub Security Advisory**: Open a private advisory on the GitHub repository page (Recommended).
- **Email**: security@stocksense.oilfield
- **Response SLA**: Initial acknowledgement within 48 hours.

Please include:
- A clear description of the vulnerability and impact.
- Step-by-step reproduction instructions or a minimal proof of concept.
- Recommended remediation steps if available.

We appreciate responsible disclosure and will credit contributors who help improve the security of StockSense.

