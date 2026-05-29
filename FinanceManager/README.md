# FinanceManager

A personal finance tracking application that automatically ingests bank transaction emails from Gmail, parses them into structured data, and provides categorization, scheduling, and notification capabilities — all through a clean web dashboard.

## Overview

FinanceManager connects to your Gmail account via OAuth 2.0, fetches transaction alert emails (currently HDFC Bank), parses them into structured transactions, and stores everything in PostgreSQL. A rule-based categorization engine automatically classifies transactions, while a built-in scheduler handles recurring jobs like periodic syncs, spending digests, and budget alerts.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Vite + React)              │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌────────┐│
│  │  Login   │  │ Dashboard  │  │Categories│  │Scheduler││
│  └──────────┘  └────────────┘  └──────────┘  └────────┘│
└────────────────────────┬────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────┐
│                  Backend (Go + Gin)                      │
│                                                          │
│  ┌─────────┐  ┌────────────┐  ┌───────────┐             │
│  │   API   │  │  Services  │  │  Workers  │             │
│  │Handlers │──│            │──│           │             │
│  └─────────┘  └────────────┘  └───────────┘             │
│       │            │                │                    │
│  ┌────▼────┐  ┌────▼─────┐  ┌──────▼──────┐            │
│  │  Auth   │  │ Parsers  │  │  Scheduler  │            │
│  │(Google) │  │ (HDFC)   │  │   Engine    │            │
│  └─────────┘  └──────────┘  └─────────────┘            │
│       │            │                │                    │
│  ┌────▼────────────▼────────────────▼───┐               │
│  │          Repositories (sqlc)         │               │
│  └──────────────────┬───────────────────┘               │
└─────────────────────┼───────────────────────────────────┘
                      │
               ┌──────▼──────┐
               │  PostgreSQL │
               └─────────────┘
```

## Tech Stack

### Backend
| Component       | Technology                                           |
|-----------------|------------------------------------------------------|
| Language        | Go 1.26                                              |
| HTTP Framework  | [Gin](https://github.com/gin-gonic/gin)              |
| Database        | PostgreSQL with [pgx/v5](https://github.com/jackc/pgx) driver |
| Query Gen       | [sqlc](https://sqlc.dev)                             |
| Migrations      | [Goose](https://github.com/pressly/goose)            |
| OAuth           | Google OAuth 2.0                                     |
| AI              | Google Gemini (via `google.golang.org/genai`)         |
| Email           | SMTP notifications                                   |

### Frontend
| Component       | Technology                                           |
|-----------------|------------------------------------------------------|
| Framework       | React 18 + TypeScript                                |
| Build Tool      | [Vite](https://vitejs.dev) 5                         |
| Routing         | React Router v6                                      |
| Data Fetching   | [TanStack Query](https://tanstack.com/query) v5      |
| Styling         | Tailwind CSS 3                                       |
| Icons           | [Lucide React](https://lucide.dev)                   |

### Infrastructure
| Component       | Technology                                           |
|-----------------|------------------------------------------------------|
| Cloud           | Oracle Cloud Infrastructure (OCI) — Always Free Tier |
| IaC             | Terraform                                            |
| Compute         | VM.Standard.A1.Flex (ARM)                            |
| Web Server      | Nginx                                                |
| TLS             | Certbot (Let's Encrypt)                              |
| Containers      | Docker                                               |

## Project Structure

```
FinanceManager/
├── backend/
│   ├── cmd/server/             # Application entrypoint
│   │   └── main.go
│   ├── internal/
│   │   ├── api/                # HTTP handlers
│   │   │   ├── auth_handler.go
│   │   │   ├── transaction_handler.go
│   │   │   ├── category_handler.go
│   │   │   ├── sync_handler.go
│   │   │   ├── scheduler_handler.go
│   │   │   └── notification_handler.go
│   │   ├── app/                # App bootstrap, routing, DI
│   │   ├── auth/               # Google OAuth config & token management
│   │   ├── config/             # Environment-based configuration
│   │   ├── db/                 # Database connection, migrations, sqlc
│   │   │   ├── migrations/     # Goose SQL migrations
│   │   │   ├── queries/        # sqlc query definitions
│   │   │   └── sqlc/           # Generated Go code
│   │   ├── integrations/       # External service clients
│   │   │   ├── gemini/         # Google Gemini AI
│   │   │   └── gmail/          # Gmail API client
│   │   ├── middleware/         # HTTP middleware (CORS, etc.)
│   │   ├── models/             # Domain models
│   │   ├── notifications/      # Email sender (SMTP)
│   │   ├── parsers/            # Transaction email parsers
│   │   │   └── banks/hdfc/     # HDFC Bank parser
│   │   ├── repositories/       # Data access layer
│   │   ├── scheduler/          # Job scheduling engine
│   │   │   └── runners/        # sync, digest, alert runners
│   │   ├── services/           # Business logic
│   │   ├── transactions/       # Transaction domain types
│   │   ├── utils/              # Shared utilities
│   │   └── worker/             # Background sync worker
│   ├── go.mod
│   ├── Makefile
│   └── sqlc.yaml
├── frontend/
│   ├── src/
│   │   ├── api/                # API client functions
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # React hooks (useAuth, etc.)
│   │   ├── pages/              # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Categories.tsx
│   │   │   └── Scheduler.tsx
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Frontend utilities
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── oci-deploy/                 # Terraform IaC for OCI
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    └── cloud-init.yaml
```

## Features

- **Gmail Sync** — Automatically fetches and parses transaction alert emails from HDFC Bank via the Gmail API. Supports both initial full sync and incremental sync using Gmail History API.
- **Transaction Parsing** — Pluggable parser architecture (`Parser` interface) to extract structured transaction data (amount, type, merchant, reference ID) from bank email HTML.
- **Auto-Categorization** — Rule-based engine that matches transactions to categories using keyword rules against merchant and transaction name fields. Handles payment gateway detection (Razorpay, Stripe, etc.).
- **Category Management** — Full CRUD for categories and per-category keyword rules.
- **Scheduler** — Built-in job scheduling engine with recurrence support. Ships with three job runners:
  - `sync` — Periodic Gmail transaction sync
  - `digest` — Spending summary emails
  - `alert` — Budget threshold notifications
- **Notifications** — In-app notification system with unread counts, mark-as-read, and email delivery via SMTP.
- **Google OAuth** — Secure authentication flow with token management for Gmail API access.

## Getting Started

### Prerequisites

- Go 1.22+
- Node.js 18+
- PostgreSQL 15+
- [Goose](https://github.com/pressly/goose) (migration tool)
- [sqlc](https://sqlc.dev) (query code generation)
- A Google Cloud project with Gmail API + OAuth 2.0 credentials

### 1. Clone the Repository

```bash
git clone https://github.com/NoirAbhinav/personalmanager.git
cd personalmanager/FinanceManager
```

### 2. Backend Setup

```bash
cd backend
```

Create a `.env` file with the following variables:

```env
PORT=8080
DATABASE_URL=postgres://user:password@localhost:5432/financemanager?sslmode=disable

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URL=http://localhost:8080/auth/google/callback

# Gemini AI (optional)
GEMINI_API_KEY=your-gemini-api-key

# SMTP Notifications (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

Run database migrations:

```bash
make migrate-up
```

Generate sqlc code (if modifying queries):

```bash
make sqlc
```

Start the server:

```bash
go run cmd/server/main.go
```

The API server starts on `http://localhost:8080`.

### 3. Frontend Setup

```bash
cd frontend
```

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Install dependencies and start:

```bash
npm install
npm run dev
```

The frontend starts on `http://localhost:5173`.

## API Endpoints

| Method   | Endpoint                              | Description                    |
|----------|---------------------------------------|--------------------------------|
| `GET`    | `/health`                             | Health check                   |
| `GET`    | `/auth/google/login`                  | Initiate Google OAuth flow     |
| `GET`    | `/auth/google/callback`               | OAuth callback handler         |
| `GET`    | `/auth/logout`                        | Logout                         |
| `GET`    | `/api/me`                             | Get current user               |
| `GET`    | `/transactions`                       | List transactions              |
| `POST`   | `/transactions/:id/category`          | Set transaction category       |
| `POST`   | `/transactions/recategorize`          | Re-run categorization rules    |
| `GET`    | `/categories`                         | List categories                |
| `POST`   | `/categories`                         | Create a category              |
| `PUT`    | `/categories/:id`                     | Update a category              |
| `DELETE` | `/categories/:id`                     | Delete a category              |
| `GET`    | `/categories/:id/rules`               | List rules for a category      |
| `POST`   | `/categories/:id/rules`               | Add a rule to a category       |
| `DELETE` | `/categories/:id/rules/:rule_id`      | Delete a category rule         |
| `POST`   | `/sync/gmail`                         | Trigger Gmail sync             |
| `GET`    | `/sync/status`                        | Get sync status                |
| `GET`    | `/scheduler/jobs`                     | List scheduled jobs            |
| `POST`   | `/scheduler/jobs`                     | Create a scheduled job         |
| `PUT`    | `/scheduler/jobs/:id`                 | Update a scheduled job         |
| `DELETE` | `/scheduler/jobs/:id`                 | Delete a scheduled job         |
| `GET`    | `/scheduler/jobs/:id/runs`            | Get job run history            |
| `GET`    | `/notifications`                      | List notifications             |
| `GET`    | `/notifications/unread-count`         | Get unread notification count  |
| `POST`   | `/notifications/:id/read`             | Mark notification as read      |
| `POST`   | `/notifications/read-all`             | Mark all notifications as read |

## Deployment

The `oci-deploy/` directory contains Terraform configuration to provision an OCI Always Free Tier ARM instance (VM.Standard.A1.Flex) with:

- Ubuntu 22.04 (ARM64)
- Nginx as reverse proxy
- Docker for containerization
- Certbot for automatic TLS certificates
- Go runtime

```bash
cd oci-deploy
terraform init
terraform plan
terraform apply
```

## Makefile Commands

```bash
# Backend
make migrate-up      # Run all pending migrations
make migrate-down    # Rollback the last migration
make migrate-status  # Show migration status
make sqlc            # Regenerate sqlc Go code

# Frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## License

Private project — not licensed for distribution.
