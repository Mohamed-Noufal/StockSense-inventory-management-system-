---
name: backend-scalable
description: Architectural guidelines and clean modular structure for scalable backend services, separation of concerns, and concise file design.
---

# Scalable Backend Architecture Skill

## 1. Core Principles
- **Separation of Concerns**: Strict division across Routers (HTTP), Schemas (Validation/DTOs), Services (Domain Logic & Orchestration), and Data Access (SQLAlchemy Models & Repositories).
- **Single Responsibility Principle (SRP)**: Each file handles one distinct domain responsibility. Keep files focused and avoid monolithic 500+ line modules.
- **Fail Fast & Explicitly**: Validate all inputs at the API gateway boundary with Pydantic v2 schemas; raise typed domain exceptions with clear HTTP status codes.

## 2. Directory Layout & Scalability Pattern
```text
backend/app/
├── api/v1/endpoints/   # Thin route handlers: parse request, call service, return schema
├── core/               # App configuration, DB session lifecycle, security, exceptions
├── models/             # Pure declarative SQLAlchemy ORM models (one per table/domain)
├── schemas/            # Request/Response Pydantic DTOs with typed fields & examples
├── services/           # Authoritative business logic, transaction boundaries
└── ai/                 # AI forecasting, advisory agents, policies, and evaluation
```

## 3. Thin Controllers, Rich Services
- Routers MUST NOT execute raw business calculations or SQL mutations directly.
- Services manage the atomic database transactions:
  ```python
  def process_movement(db: Session, req: MovementCreate) -> StockMovement:
      # 1. Enforce business invariants
      # 2. Append ledger movement
      # 3. Update stock balance
      # 4. Commit atomically
  ```
