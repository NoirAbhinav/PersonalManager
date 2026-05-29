# PersonalManager

A monorepo containing personal productivity tools and web presence — a full-stack **Finance Tracker** that auto-ingests bank transactions from Gmail, and a **Developer Portfolio** website built with Next.js.

---

## Table of Contents

- [Overview](#overview)
- [Repository Structure](#repository-structure)
- [Projects](#projects)
  - [FinanceManager](#financemanager)
  - [Portfolio](#portfolio)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [FinanceManager Setup](#financemanager-setup)
  - [Portfolio Setup](#portfolio-setup)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## Overview

This repository is organized as a monorepo with two independent projects:

| Project | Description | Stack |
|---------|-------------|-------|
| **FinanceManager** | Automated personal finance tracker — syncs HDFC Bank transaction emails from Gmail, parses them, auto-categorizes, and provides scheduling & notification capabilities via a web dashboard | Go · React · PostgreSQL · Terraform |
| **Portfolio** | Personal developer portfolio website with animated sections, terminal emulator, GitHub activity integration, and resume download | Next.js · TypeScript · Tailwind CSS · Framer Motion |

---

## Repository Structure

```
PersonalManager/
├── FinanceManager/                 # Finance tracking application
│   ├── backend/                    # Go API server (Gin + sqlc + PostgreSQL)
│   │   ├── cmd/server/             # Application entrypoint
│   │   ├── internal/
│   │   │   ├── api/                # HTTP handlers
│   │   │   ├── app/                # App bootstrap, routing, DI
│   │   │   ├── auth/               # Google OAuth config & token management
│   │   │   ├── config/             # Environment-based configuration
│   │   │   ├── db/                 # Database connection, migrations (Goose), sqlc
│   │   │   │   ├── migrations/     # SQL migration files
│   │   │   │   ├── queries/        # sqlc query definitions
│   │   │   │   └── sqlc/           # Generated Go code
│   │   │   ├── integrations/       # External service clients
│   │   │   │   ├── gemini/         # Google Gemini AI
│   │   │   │   └── gmail/          # Gmail API client
│   │   │   ├── middleware/         # HTTP middleware (CORS, etc.)
│   │   │   ├── models/             # Domain models
│   │   │   ├── notifications/      # Email sender (SMTP)
│   │   │   ├── parsers/            # Transaction email parsers (HDFC Bank)
│   │   │   ├── repositories/       # Data access layer
│   │   │   ├── scheduler/          # Job scheduling engine + runners
│   │   │   ├── services/           # Business logic
│   │   │   ├── transactions/       # Transaction domain types
│   │   │   ├── utils/              # Shared utilities
│   │   │   └── worker/             # Background sync worker
│   │   ├── go.mod
│   │   ├── Makefile
│   │   └── sqlc.yaml
│   ├── frontend/                   # React dashboard (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── api/                # API client functions
│   │   │   ├── components/         # Reusable UI components
│   │   │   ├── hooks/              # React hooks
│   │   │   ├── pages/              # Page components
│   │   │   ├── types/              # TypeScript type definitions
│   │   │   └── utils/              # Frontend utilities
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   └── oci-deploy/                 # Terraform IaC for Oracle Cloud
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── cloud-init.yaml
├── portfolio/                      # Developer portfolio website
│   ├── app/
│   │   ├── api/                    # Next.js API routes (GitHub activity)
│   │   ├── layout.tsx              # Root layout with SEO metadata
│   │   ├── globals.css             # Global styles & design system
│   │   └── page.tsx                # Home page
│   ├── components/
│   │   ├── Hero.tsx                # Terminal boot animation hero section
│   │   ├── About.tsx               # About section
│   │   ├── Experience.tsx          # Work experience timeline
│   │   ├── SkillsRadar.tsx         # Interactive skills radar chart
│   │   ├── GithubActivity.tsx      # Live GitHub contribution graph
│   │   ├── Blog.tsx                # Blog section
│   │   ├── Contact.tsx             # Contact form
│   │   ├── Terminal.tsx            # Interactive terminal emulator
│   │   ├── Navbar.tsx              # Navigation bar
│   │   ├── AnimatedBackground.tsx  # Particle background animation
│   │   └── StatusBanner.tsx        # Availability status banner
│   ├── public/
│   │   ├── profile.jpg
│   │   ├── og-image.png
│   │   └── Abhinav_Nair_Resume.pdf
│   ├── package.json
│   ├── next.config.ts
│   └── tsconfig.json
├── .github/
│   ├── agents/                     # GitHub Copilot agent configs
│   └── copilot-instructions.md     # Project context for AI assistants
├── .gitignore
└── README.md                       # ← You are here
```

---

## Projects

### FinanceManager

A personal finance tracking application that automatically ingests bank transaction emails from Gmail, parses them into structured data, and provides categorization, scheduling, and notification capabilities through a web dashboard.

#### Key Features

- **Gmail Sync** — Fetches and parses transaction alert emails via the Gmail API. Supports both full and incremental sync using message-ID cutoff (with Gmail History API migration planned).
- **Transaction Parsing** — Pluggable parser architecture (`Parser` interface) to extract structured data (amount, type, merchant, reference ID) from bank email HTML. Currently supports HDFC Bank.
- **Auto-Categorization** — Rule-based engine matching transactions to categories via keyword rules against merchant/transaction name fields. Detects payment gateways (Razorpay, Stripe, etc.).
- **Category Management** — Full CRUD for categories and per-category keyword rules.
- **Scheduler** — Built-in job scheduling engine with recurrence support. Ships with runners for periodic sync, spending digests, and budget threshold alerts.
- **Notifications** — In-app notification system with unread counts, mark-as-read, and email delivery via SMTP.
- **AI Integration** — Google Gemini integration for intelligent transaction analysis.
- **Google OAuth** — Secure authentication with token persistence and automatic refresh.

#### Architecture

```
handler → service → repository → sqlc → PostgreSQL
```

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Vite + React)                │
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

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/auth/google/login` | Initiate Google OAuth flow |
| `GET` | `/auth/google/callback` | OAuth callback handler |
| `GET` | `/auth/logout` | Logout |
| `GET` | `/api/me` | Get current user |
| `GET` | `/transactions` | List transactions |
| `POST` | `/transactions/:id/category` | Set transaction category |
| `POST` | `/transactions/recategorize` | Re-run categorization rules |
| `GET` | `/categories` | List categories |
| `POST` | `/categories` | Create a category |
| `PUT` | `/categories/:id` | Update a category |
| `DELETE` | `/categories/:id` | Delete a category |
| `GET` | `/categories/:id/rules` | List rules for a category |
| `POST` | `/categories/:id/rules` | Add a rule to a category |
| `DELETE` | `/categories/:id/rules/:rule_id` | Delete a category rule |
| `POST` | `/sync/gmail` | Trigger Gmail sync |
| `GET` | `/sync/status` | Get sync status |
| `GET` | `/scheduler/jobs` | List scheduled jobs |
| `POST` | `/scheduler/jobs` | Create a scheduled job |
| `PUT` | `/scheduler/jobs/:id` | Update a scheduled job |
| `DELETE` | `/scheduler/jobs/:id` | Delete a scheduled job |
| `GET` | `/scheduler/jobs/:id/runs` | Get job run history |
| `GET` | `/notifications` | List notifications |
| `GET` | `/notifications/unread-count` | Get unread notification count |
| `POST` | `/notifications/:id/read` | Mark notification as read |
| `POST` | `/notifications/read-all` | Mark all notifications as read |

> 📖 For detailed FinanceManager documentation, see [`FinanceManager/README.md`](FinanceManager/README.md).

---

### Portfolio

A modern, animated developer portfolio website showcasing professional experience, skills, and projects. Features a terminal-inspired design aesthetic with interactive elements.

#### Key Features

- **Terminal Boot Animation** — Hero section with a simulated terminal boot sequence.
- **Interactive Terminal** — Full terminal emulator component supporting custom commands.
- **Skills Radar Chart** — Interactive radar visualization of technical skills.
- **GitHub Activity Graph** — Live GitHub contribution heatmap via API integration.
- **Animated Background** — Particle-based background animation.
- **Responsive Design** — Fully responsive across all device sizes.
- **SEO Optimized** — Full Open Graph and Twitter Card metadata, structured headings, and semantic HTML.
- **Resume Download** — Direct PDF resume download.

#### Sections

| Section | Component | Description |
|---------|-----------|-------------|
| Hero | `Hero.tsx` | Terminal boot animation, name, role, stack badges, CTAs |
| About | `About.tsx` | Personal introduction |
| Experience | `Experience.tsx` | Work experience timeline |
| Skills | `SkillsRadar.tsx` | Interactive radar chart of technical skills |
| GitHub | `GithubActivity.tsx` | Live contribution graph |
| Blog | `Blog.tsx` | Blog posts section |
| Contact | `Contact.tsx` | Contact form and details |
| Terminal | `Terminal.tsx` | Interactive terminal emulator overlay |

---

## Getting Started

### Prerequisites

| Tool | Version | Required For |
|------|---------|-------------|
| **Go** | 1.22+ | FinanceManager backend |
| **Node.js** | 18+ | Both projects |
| **PostgreSQL** | 15+ | FinanceManager backend |
| **Goose** | latest | Database migrations |
| **sqlc** | latest | Query code generation |
| **Terraform** | latest | OCI deployment (optional) |

You will also need a **Google Cloud project** with Gmail API enabled and OAuth 2.0 credentials configured.

### FinanceManager Setup

#### 1. Backend

```bash
cd FinanceManager/backend
```

Create a `.env` file:

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

Run migrations and start the server:

```bash
make migrate-up          # Run database migrations
make sqlc                # Regenerate query code (if modifying queries)
go run cmd/server/main.go
```

The API server starts on `http://localhost:8080`.

#### 2. Frontend

```bash
cd FinanceManager/frontend
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

The dashboard starts on `http://localhost:5173`.

#### Makefile Commands

```bash
make migrate-up       # Run all pending migrations
make migrate-down     # Rollback the last migration
make migrate-status   # Show migration status
make sqlc             # Regenerate sqlc Go code
```

---

### Portfolio Setup

```bash
cd portfolio
```

Create a `.env.local` file with your environment variables (GitHub token for activity feed, etc.).

Install dependencies and start:

```bash
npm install
npm run dev
```

The portfolio starts on `http://localhost:3000`.

#### Build for Production

```bash
npm run build
npm run start
```

---

## Deployment

### FinanceManager — Oracle Cloud Infrastructure

The `FinanceManager/oci-deploy/` directory contains Terraform configuration to provision an **OCI Always Free Tier** ARM instance:

| Resource | Spec |
|----------|------|
| **Shape** | VM.Standard.A1.Flex (Ampere ARM) |
| **OS** | Ubuntu 22.04 (ARM64) |
| **OCPUs** | 1 (up to 4 free) |
| **Memory** | 4 GB (up to 24 GB free) |
| **Boot Volume** | 50 GB (200 GB total free) |

The cloud-init script automatically provisions:
- **Go** runtime
- **Docker** + Docker Compose
- **Nginx** as reverse proxy
- **Certbot** for automatic TLS via Let's Encrypt
- Firewall rules for ports 22, 80, 443

```bash
cd FinanceManager/oci-deploy
terraform init
terraform plan
terraform apply
```

### Portfolio

The portfolio is a standard Next.js app and can be deployed to any platform that supports it:
- **Vercel** (recommended) — zero-config deployment
- **OCI** — using the same ARM instance with Nginx

---

## Tech Stack

### FinanceManager

| Layer | Technology |
|-------|-----------|
| **Backend** | Go 1.26 · [Gin](https://github.com/gin-gonic/gin) · [pgx/v5](https://github.com/jackc/pgx) · [sqlc](https://sqlc.dev) · [Goose](https://github.com/pressly/goose) |
| **Frontend** | React 18 · TypeScript · [Vite](https://vitejs.dev) 5 · [TanStack Query](https://tanstack.com/query) v5 · Tailwind CSS 3 · [Lucide](https://lucide.dev) |
| **Integrations** | Google OAuth 2.0 · Gmail API · Google Gemini AI · SMTP |
| **Infrastructure** | OCI Always Free Tier · Terraform · Docker · Nginx · Certbot |

### Portfolio

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js](https://nextjs.org) 16 · React 19 · TypeScript |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) 4 · Vanilla CSS |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Fonts** | JetBrains Mono · Syne (via `next/font`) |

---

## License

Private project — not licensed for distribution.
