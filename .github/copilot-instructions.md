# Personal Manager Backend — Copilot Instructions

## Project Overview

This project is a backend-first personal management platform written in Go.

The system ingests personal data from external integrations such as:
- Gmail
- Calendar providers
- Banking notifications
- Productivity tools
- Future third-party integrations

The initial feature set focuses on:
- Google OAuth authentication
- Gmail integration
- Fetching and storing emails
- Extracting financial transactions from emails

Long term, the platform will evolve into a generalized personal event ingestion and processing system.

---

# Core Architecture Principles

## 1. Monolith First

This project intentionally uses a modular monolith architecture.

DO NOT introduce:
- microservices
- distributed systems
- event brokers
- Kubernetes-specific abstractions
- CQRS/Event Sourcing complexity

The backend should remain:
- simple
- maintainable
- scalable through modular boundaries

---

## 2. Raw Data First

External integrations should NEVER directly mutate domain entities.

Correct flow:

Integration → Raw Event Storage → Processors → Normalized Domain Entities

Example:

Gmail API → raw_events table → transaction processor → transactions table

Always preserve raw source payloads.

---

## 3. Separation of Concerns

Keep layers isolated.

### API Layer
Responsible only for:
- request parsing
- validation
- response formatting

### Service Layer
Responsible for:
- business logic
- orchestration

### Repository Layer
Responsible only for:
- database access

### Integration Layer
Responsible for:
- external APIs
- OAuth flows
- third-party communication

---

# Tech Stack

## Backend
- Go
- Gin HTTP framework
- PostgreSQL
- pgx/sqlc preferred over ORM
- Google OAuth2
- Gmail API

## Future Additions
- Redis
- Asynq workers
- Webhooks
- AI enrichment pipelines

---

# Coding Standards

## General Go Rules

- Prefer standard library when possible
- Keep dependencies minimal
- Avoid unnecessary abstractions
- Prefer explicit code over magic
- Favor composition over inheritance-like patterns
- Keep functions small and focused

---

## Error Handling

Always return wrapped errors using:

```go
fmt.Errorf("fetch gmail messages: %w", err)
```

Never silently ignore errors.

---

## Context Usage

All I/O operations must accept context.Context.

Example:

```go
func (s *Service) SyncEmails(ctx context.Context, userID string) error
```

---

## Interfaces

DO NOT create interfaces prematurely.

Only introduce interfaces when:
- multiple implementations exist
- testing genuinely benefits

Avoid Java-style overengineering.

---

# Folder Structure

Backend structure:

```text
backend/
├── cmd/
│   └── server/
├── internal/
│   ├── api/
│   ├── auth/
│   ├── config/
│   ├── db/
│   ├── integrations/
│   │   └── gmail/
│   ├── ingestion/
│   ├── parsing/
│   ├── normalization/
│   ├── domain/
│   ├── repositories/
│   ├── services/
│   ├── jobs/
│   ├── middleware/
│   └── utils/
├── migrations/
└── scripts/
```

---

# Database Guidelines

## Preferred Approach

Use:
- pgx
OR
- sqlc

Avoid heavy ORM usage unless explicitly needed.

---

## Tables

The system revolves around raw ingestion.

Important tables include:
- users
- integrations
- raw_events
- transactions

---

## raw_events Table

This is the core ingestion pipeline table.

It stores:
- provider
- source type
- raw payload
- metadata
- processing status

Processors consume raw_events asynchronously.

---

# API Guidelines

## REST Style

Use predictable REST conventions.

Examples:

```text
GET    /health
GET    /auth/google/login
GET    /auth/google/callback
POST   /sync/gmail
GET    /events
GET    /transactions
```

---

## Response Shape

Use consistent JSON responses.

Success:

```json
{
  "data": {}
}
```

Error:

```json
{
  "error": {
    "message": "something failed"
  }
}
```

---

# Gmail Integration Rules

## Gmail Is an Integration

Do NOT tightly couple Gmail to transactions.

Gmail provides raw ingestible events.

Transaction extraction happens later in processors.

---

## Initial Gmail Goals

First implementation should:
- authenticate user
- fetch latest emails
- store raw payloads

Do NOT prematurely optimize parsing logic.

---

# Parsing Rules

Parsing should be:
- deterministic
- testable
- provider-specific

Use:
- regex
- structured extraction
- normalization pipelines

Avoid AI/LLM parsing initially.

---

# Concurrency Rules

Use goroutines carefully.

Prefer:
- bounded concurrency
- worker pools
- context cancellation

Avoid:
- uncontrolled goroutine spawning
- shared mutable state

---

# Logging

Use structured logging.

Preferred fields:
- request_id
- user_id
- provider
- integration
- operation

Never log:
- access tokens
- refresh tokens
- sensitive email content

---

# Security Rules

- Never hardcode secrets
- Use environment variables
- Encrypt sensitive integration credentials
- Validate OAuth state parameters
- Sanitize external payloads
- Never trust client input

---

# Testing Philosophy

Prioritize:
- service tests
- parser tests
- repository tests

Avoid excessive mocking.

Prefer real integration-style testing when feasible.

---

# Performance Philosophy

Do not optimize prematurely.

Focus first on:
- correctness
- maintainability
- clean architecture

Optimize only after bottlenecks are measurable.

---

# Important Philosophy

This project is intended to become a generalized personal data orchestration platform.

The backend should evolve as:
- integration-first
- ingestion-driven
- event-oriented
- modular

without becoming unnecessarily distributed or overengineered.