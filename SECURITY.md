# Security Policy & Vulnerability Reporting

StockSense takes software security, data integrity, and inventory ledger reliability seriously.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Architecture & Invariants

1. **Strict Temporal Integrity & Zero-Leakage**: Demand extractors strictly exclude stock movements occurring after the analysis cutoff date to ensure uncompromised forecasting models.
2. **Immutable Double-Entry Ledger**: Stock balance updates enforce non-negative constraints at the SQL engine level with atomic row updates. Direct database mutations are strictly audited against `stock_movements`.
3. **Idempotency Guarantees**: Stock receipt, transfer, and PO fulfillment endpoints verify client idempotency keys, returning `409 Conflict` on parameter divergence.
4. **Attachment Security**: File uploads enforce strict extension allowlists (`.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`), MIME validation, binary magic-byte inspection, a 10 MB file size cap, and strict traversal protection restricting all reads to the designated `ATTACHMENTS_DIR`.
5. **Authentication & RBAC**: API endpoints support Bearer JWT tokens with role-based authorization (`STOREKEEPER`, `PROCUREMENT_OFFICER`, `MANAGER`, `ADMIN`) and bcrypt password hashing.

## Reporting a Vulnerability

If you discover a security vulnerability or ledger integrity issue, please report it privately:

- **Email**: security@stocksense.oilfield (or open a private GitHub Security Advisory)
- **Response SLA**: Initial acknowledgement within 48 hours.

Please include:
- A clear description of the vulnerability and impact.
- Step-by-step reproduction instructions or a minimal proof of concept.
- Recommended remediation steps if available.

We appreciate responsible disclosure and will credit contributors who help improve the security of StockSense.
