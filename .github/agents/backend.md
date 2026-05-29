---
kind: agent
name: Backend Agent
description: Specialized agent for PersonalManager backend development with Go, Gin, PostgreSQL, and sqlc
applyTo: backend/**/*.go
---

# Backend Agent for PersonalManager

You are an expert backend engineer specializing in the PersonalManager project architecture. Your role is to help with Go backend development, database operations, API design, and system integration.

## Project Context

- **Framework**: Gin (HTTP)
- **Database**: PostgreSQL with sqlc (type-safe SQL queries)
- **Architecture**: Layered clean architecture
- **Key Pattern**: Handler → Service → Repository → sqlc → PostgreSQL

## Backend Directory Structure

```
backend/
├── cmd/server/
│   └── main.go                    # Entry point: DI container, router setup, server init
├── internal/
│   ├── api/                       # HTTP handlers (Gin)
│   │   ├── auth_handler.go        # OAuth flow, session management
│   │   ├── sync_handler.go        # Gmail sync trigger/status
│   │   └── transaction_handler.go # Transaction retrieval
│   ├── auth/
│   │   ├── google.go              # OAuth2 config initialization
│   │   └── tokenmanager.go        # Token refresh logic
│   ├── config/
│   │   └── config.go              # Environment loading (.env)
│   ├── db/
│   │   ├── postgres.go            # PGX pool initialization
│   │   ├── migrations/            # Numbered SQL migrations (001-006)
│   │   ├── queries/               # SQLC query definitions (.sql)
│   │   └── sqlc/                  # Generated SQLC code (read-only)
│   ├── integrations/gmail/
│   │   ├── client.go              # Gmail API client factory
│   │   ├── service.go             # Email fetching & MIME parsing
│   │   └── profile.go             # User profile retrieval
│   ├── parsers/
│   │   └── hdfc.go                # HDFC transaction parsing
│   ├── repositories/              # Data access layer
│   │   ├── user_repository.go
│   │   ├── oauth_respository.go
│   │   ├── transaction_respository.go
│   │   └── sync_state_respository.go
│   ├── services/
│   │   ├── gmail_sync.go          # Sync orchestration logic
│   │   └── transactions.go        # Transaction business logic
│   └── worker/
│       └── sync_worker.go         # Background sync job queue
├── go.mod                         # Dependencies
├── sqlc.yaml                      # SQLC configuration
└── Makefile
```

## Architecture Principles

Follow the established layered architecture strictly but pragmatically:

1. **Handlers** (api/ folder): Thin request/response layer only
   - Extract parameters from Gin context
   - Call services
   - Return HTTP responses
   - Keep business logic OUT

2. **Services** (services/ folder): Business logic and orchestration
   - Coordinate between repositories
   - Handle transformations
   - Implement business rules
   - No direct HTTP concerns

3. **Repositories** (repositories/ folder): Data persistence layer
   - Wrap sqlc operations
   - Only expose query operations needed by services
   - Handle pgtype conversions (Text, Timestamp for nullables)
   - Never leak database details to services

4. **Integrations** (integrations/ folder): External service clients
   - Gmail integration only talks to Gmail API
   - Should be called by services only, never by handlers directly
   - Keep API-specific logic isolated

5. **Parsers** (parsers/ folder): Data transformation
   - HDFC email parsing logic
   - Transaction extraction
   - Format normalization

## All Repositories

### UserRepository (`internal/repositories/user_repository.go`)
**Constructor:** `NewUserRepository(queries *sqlc.Queries) *UserRepository`

**Methods:**
- `GetByEmail(ctx context.Context, email string) (*User, error)` - Fetch user by email
- `Create(ctx context.Context, email string) (*User, error)` - Create new user
- `GetAll(ctx context.Context) ([]User, error)` - Fetch all users

**Dependencies:** `*sqlc.Queries`

**Key Details:** Used during OAuth callback for first-time user creation and validation.

---

### OAuthRepository (`internal/repositories/oauth_respository.go`)
**Constructor:** `NewOAuthRepository(queries *sqlc.Queries) *OAuthRepository`

**Methods:**
- `SaveGoogleToken(ctx context.Context, userID string, email string, accessToken string, refreshToken string, tokenType string, expiry time.Time) error`
  - Upserts OAuth token (creates or updates via ON CONFLICT)
  - Stores tokens for user + provider combination
  
- `GetByUserIDAndProvider(ctx context.Context, userID string, provider string) (*OauthIntegration, error)`
  - Fetch OAuth record by user ID and provider
  
- `UpdateToken(ctx context.Context, userID string, accessToken string, expiry time.Time) error`
  - Update access token and expiry after refresh
  
- `GetByEmail(ctx context.Context, userID string, email string) (*OauthIntegration, error)`
  - Fetch OAuth record by user ID and email

**Dependencies:** `*sqlc.Queries`

**Key Details:**
- Uses `ON CONFLICT (user_id, provider, email) DO UPDATE SET` for upserts
- Stores `refresh_token` persistently for offline access (auto-refresh capability)
- Wraps nullable fields with `pgtype.Text` and `pgtype.Timestamp`
- Unique constraint: `(user_id, provider, email)` ensures one token per provider/email

---

### TransactionRepository (`internal/repositories/transaction_respository.go`)
**Constructor:** `NewTransactionRepository(queries *sqlc.Queries) *TransactionRepository`

**Methods:**
- `Create(ctx context.Context, transaction *sqlc.CreateTransactionParams) error`
  - Insert transaction with ON CONFLICT duplicate handling
  - Silently skips duplicate inserts via `ON CONFLICT (reference_id) DO NOTHING`
  
- `GetAll(ctx context.Context) ([]sqlc.Transaction, error)`
  - Fetch all transactions ordered by `occurred_at DESC`

**Dependencies:** `*sqlc.Queries`, `*parsers.Transaction`

**Key Details:**
- Reference ID is the unique constraint key for deduplication
- Converts `parsers.Transaction` to sqlc params with nullable field handling
- ON CONFLICT ensures idempotency even if sync retried mid-flight

---

### SyncStateRepository (`internal/repositories/sync_state_respository.go`)
**Constructor:** `NewSyncStateRepository(queries *sqlc.Queries) *SyncStateRepository`

**Methods:**
- `GetByEmail(ctx context.Context, email string) (*SyncState, error)`
  - Fetch sync state for email (get `last_message_id`)
  
- `SaveLastMessageID(ctx context.Context, email string, lastMessageID string) error`
  - Upsert last synced message ID (creates or updates)
  
- `UpdateStatus(ctx context.Context, email string, status string, syncErr *string) error`
  - Update sync status: "idle", "syncing", "completed", "failed"
  - Stores error message if sync failed
  
- `GetStatus(ctx context.Context, email string) (string, *string, time.Time, error)`
  - Returns current status, error (if any), and updated_at timestamp

**Dependencies:** `*sqlc.Queries`

**Key Details:**
- Email is unique constraint for sync state
- Tracks `last_message_id` for incremental sync cutoff (stops processing at previously synced message)
- Stores sync job status and error messages for worker monitoring

---

## Config Package (`internal/config/config.go`)

**Config struct:**
```go
type Config struct {
    Port              string // Server port (default: "8080")
    GoogleClientID    string
    GoogleClientSecret string
    GoogleRedirectURL string
    DatabaseURL      string // PostgreSQL connection string
}
```

**Load Function:** `Load() *Config`
- Loads `.env` file via `godotenv.Load()` (optional)
- Falls back to environment variables if .env not found
- Provides sensible defaults (PORT=8080, others empty)
- Required vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DATABASE_URL

---

## Auth Package

### google.go - OAuth2 Configuration

**Function:** `NewGoogleOAuthConfig(cfg *Config) *oauth2.Config`

**Configuration Details:**
- **Scopes:** `gmail.GmailReadonlyScope` (read-only Gmail access only)
- **Endpoint:** `google.Endpoint`
- **Auth Options:**
  - `oauth2.AccessTypeOffline` - Forces refresh token issuance
  - `oauth2.ApprovalForce` - Forces consent screen (user sees it every time)

**Used in:** AuthHandler during login flow

---

### tokenmanager.go - Token Refresh & Persistence

**Function:** `RefreshToken(ctx context.Context, oauthConfig *oauth2.Config, token *oauth2.Token, userID string, oauthRepository *repositories.OAuthRepository) (*oauth2.Token, error)`

**Refresh Flow:**
1. Create `oauth2.TokenSource` from config + existing token
2. Call `TokenSource.Token()` (automatically refreshes if expired)
3. Persist new `AccessToken` + `Expiry` to DB via OAuthRepository
4. Return refreshed token

**Key Details:**
- Centralizes OAuth2 token lifecycle management
- Auto-handles expiry checks (oauth2 library handles this)
- Persists refreshed token immediately for subsequent requests
- Called by SyncWorker before each sync to ensure fresh token

---

## Gmail Integration Package

### client.go - Gmail API Client Factory

**Function:** `NewClient(ctx context.Context, oauthConfig *oauth2.Config, token *oauth2.Token) (*gmail.Service, error)`

**Behavior:**
- Creates HTTP client from OAuth token via `oauth2.NewClient()`
- Wraps client in Gmail service with `option.WithHTTPClient()`
- Returns authenticated `*gmail.Service` (google.golang.org/api/gmail/v1)

**Used by:** GmailSyncService during sync flow

---

### service.go - Email Fetching & MIME Parsing

**Email struct:**
```go
type Email struct {
    ID       string  // Gmail message ID
    ThreadID string
    From     string  // Sender email
    Subject  string
    Snippet  string  // Gmail preview snippet
    HTMLBody string  // Extracted HTML body
    TextBody string  // Extracted plain text body
}
```

**Methods:**

**FetchEmails(ctx context.Context, query string, maxResults int64) ([]Email, error)**
- Queries Gmail API with Gmail Search query syntax (e.g., `from:alerts@hdfcbank.bank.in`)
- Fetches up to `maxResults` messages (newest first)
- For each message:
  - Gets full message with headers + payload
  - Recursively extracts MIME parts (HTML + text)
  - Base64-decodes bodies
  - Returns slice of Email structs with bodies populated

**extractBodyParts(part *gmail.MessagePart, email *Email) (internal)**
- Recursive MIME part traversal
- Handles `text/plain` and `text/html` MIME types
- Descends into nested parts (multipart structures)
- Populates Email.HTMLBody or Email.TextBody

**decodeBody(data string) -> string (internal)**
- Base64 URL decoding (handles padding)

### profile.go - User Profile

**Function:** `GetProfile(ctx context.Context, service *gmail.Service) (string, error)`

**Behavior:**
- Calls Gmail Users.GetProfile("me")
- Returns authenticated user's email address

**Used by:** AuthHandler during OAuth callback to verify login email

---

## Parsers Package (`internal/parsers/hdfc.go`)

**Transaction struct:**
```go
type Transaction struct {
    Amount       float64   // Transaction amount (parsed from "Rs.X.XX")
    Type         string    // "debited" or "credited"
    AccountLast4 string    // Last 4 digits of account
    Merchant     string    // Merchant/VPA name
    Name         string    // Transaction description
    ReferenceID  string    // Unique reference (UPI txn ID or card txn ID)
    OccurredAt   time.Time // Transaction timestamp
}
```

### ParseHDFCTransaction(body string) -> (*Transaction, error)

**Pattern Match:**
```regex
Rs.(\d+\.\d+) is (debited|credited) from your account ending (\d+) towards VPA (\S+) \(([^)]+)\) on (\d{2}-\d{2}-\d{2})
```

**Extracted Fields:**
- Amount: `Rs.X.XX` format → float64
- Type: "debited" or "credited"
- AccountLast4: Last 4 digits
- Merchant: VPA address (e.g., merchant@okhdfcbank)
- Name: Merchant name in parentheses
- OccurredAt: Date in `02-01-06` format
- ReferenceID: Optionally from `UPI transaction reference no.: (\d+)` pattern

**Handles:** UPI/IMPS transfers to/from HDFC accounts

---

### ParseHDFCInternationalCardTransaction(body string) -> (*Transaction, error)

**Pattern Match:**
```regex
Your HDFC Bank (Debit|Credit) Card ending in (?:XX)?(\d{4}) was used for an international purchase of (?:INR|Rs\.?) ([\d,]+\.\d+) on (\d{2}/\d{2}/\d{4}) at ([^.<]+)
```

**Extracted Fields:**
- Card type: "Debit" or "Credit"
- AccountLast4: Card last 4 digits
- Amount: `Rs.X,XXX.XX` format (comma handling) → float64
- OccurredAt: Date in `02/01/2006` format
- Merchant: Merchant name
- Type: Always "debited" (international purchases always debit)
- ReferenceID: None (not in email pattern yet)

**Handles:** International credit/debit card purchases

---

## Services Layer

### GmailSyncService (`internal/services/gmail_sync.go`)

**Constructor:**
```go
NewGmailSyncService(
    gmailService *gmail.Service,
    transactionRepository *repositories.TransactionRepository,
    syncStateRepository *repositories.SyncStateRepository,
) *GmailSyncService
```

**Core Method:**
```go
SyncHDFCTransactions(
    ctx context.Context,
    email string,
    onProgress func(current, total int),
) error
```

**Orchestration Flow:**
1. Load sync state for email (retrieve `last_message_id` cutoff)
2. Fetch emails: Query `from:alerts@hdfcbank.bank.in` (max 100 results)
3. Filter to pending emails:
   - Stop processing when encountering previously synced message ID
   - Emails returned newest-first from Gmail API
4. **For each pending email:**
   - Attempt HDFC UPI parse via `parsers.ParseHDFCTransaction()`
   - If fails, attempt international card parse via `parsers.ParseHDFCInternationalCardTransaction()`
   - Insert into DB via `transactionRepository.Create()` (duplicates silently ignored via ON CONFLICT)
   - Report progress via callback `onProgress(current, total)`
5. Update sync state with newest message ID via `syncStateRepository.SaveLastMessageID()`

**Key Behaviors:**
- Stops when encountering previously synced message ID (incremental sync)
- Silently skips unparseable emails (logs errors internally)
- Progress callback enables real-time UI updates
- Duplicate transactions prevented by reference_id unique constraint
- On subsequent syncs, only processes newer emails than last_message_id

---

### TransactionService (`internal/services/transactions.go`)

**Constructor:**
```go
NewTransactionService(
    transactionRepository *repositories.TransactionRepository,
) *TransactionService
```

**Method:**
```go
GetTransactions(ctx context.Context) ([]sqlc.Transaction, error)
```
- Thin wrapper around repository's `GetAll()`
- Returns transactions ordered by `occurred_at DESC`

---

## HTTP Handlers & Routes

### AuthHandler (`internal/api/auth_handler.go`)

**Constructor Dependencies:**
- `*oauth2.Config`
- `*repositories.TransactionRepository`
- `*repositories.OAuthRepository`
- `*repositories.SyncStateRepository`
- `*repositories.UserRepository`
- `*gmail.Service`

**Route: GET /auth/google/login**
- Check for existing `session_user` cookie
- If valid: redirect to `/dashboard`
- Otherwise: 
  - Generate random state string
  - Store in `oauth_state` cookie
  - Redirect to Google OAuth URL with `AccessTypeOffline` and `ApprovalForce`

**Route: GET /auth/google/callback**
- Extract `code` and `state` from query params
- Validate CSRF: compare `state` with `oauth_state` cookie
- Exchange auth code for token via `oauth2Config.Exchange()`
- Create Gmail client + service
- Get user email via `gmail.GetProfile()`
- **User creation:** 
  - Check if user exists by email
  - If first-time: create new user record
  - If exists: load existing user
- Save OAuth token to `oauth_integrations` table via `oauthRepository.SaveGoogleToken()`
- **Initial sync (first-time users only):** Trigger `GmailSyncService.SyncHDFCTransactions()` (blocking)
- Set `session_user` cookie with 7-day expiry
- Redirect to `/dashboard`

**Route: GET /auth/logout**
- Clear `session_user` and `oauth_state` cookies
- Redirect to login page

**Route: GET /api/me**
- Extract email from `session_user` cookie
- Return `{"email": "user@gmail.com"}`
- Requires valid session cookie

---

### SyncHandler (`internal/api/sync_handler.go`)

**Constructor:** `NewSyncHandler(worker *worker.SyncWorker)`

**Route: POST /sync/gmail**
- Extract email from `session_user` cookie (auth check)
- Call `worker.Enqueue(email)` 
  - Returns false if sync already in progress
  - Returns true if queued successfully
- On conflict (already syncing): return `409 Conflict`
- On success: return `202 Accepted` with `{"status": "syncing"}`

**Route: GET /sync/status**
- Extract email from `session_user` cookie
- Return current sync status: `{"status": "syncing", "total": 42, "error": null}`
- Status values: "idle", "syncing", "completed", "failed"

---

### TransactionHandler (`internal/api/transaction_handler.go`)

**Constructor:** `NewTransactionHandler(service *services.TransactionService)`

**Route: GET /transactions**
- Fetch all transactions via `transactionService.GetTransactions()`
- Return JSON array ordered by `occurred_at DESC`
- Response: `[{id, amount, type, account_last4, merchant, name, reference_id, occurred_at, user_id}, ...]`

---

## Background Worker (`internal/worker/sync_worker.go`)

**SyncStatus struct:**
```go
type SyncStatus struct {
    Status string // "idle" | "syncing" | "completed" | "failed"
    Total  int    // Count of synced emails in this batch
    Error  string // Error message if failed
}
```

**Constructor:** `NewSyncWorker(cfg *config.Config, repositories...) *SyncWorker`
- Initializes with all repositories and oauth config
- Creates buffered job queue (capacity 100)
- Initializes status map for tracking per-email progress

**Method: Start(ctx context.Context) -> (blocks)**
- Runs event loop consuming from internal `queue` channel
- For each dequeued email:
  - Calls `process(ctx, email)` to execute sync
  - Updates status on completion or error
- Exits on context cancellation

**Method: Enqueue(email string) -> bool**
- Thread-safe via mutex
- Returns false if sync already in progress for that email (status != "idle")
- Sets status to "syncing"
- Pushes email to queue channel
- Returns true

**Method: GetStatus(email string) -> SyncStatus**
- Thread-safe lookup in status map
- Returns "idle" if no record exists
- Safe to call concurrently

**Private Method: process(ctx context.Context, email string)**
1. Fetch user by email via `UserRepository.GetByEmail()`
2. Load OAuth integration for user via `OAuthRepository.GetByUserIDAndProvider()`
3. Construct `oauth2.Token` from integration
4. Call `auth.RefreshToken()` to refresh access token (persists to DB)
5. Create Gmail client via `gmail.NewClient()`
6. Create Gmail service wrapper
7. Instantiate `GmailSyncService`
8. Call `SyncHDFCTransactions()` with progress callback
9. On success: Update status to "completed" + store total count
10. On error: Catch at each step, set status to "failed" + store error message

**Key Design Patterns:**
- Queue-based async processing with dedicated goroutine
- Prevents duplicate concurrent syncs per email (mutex-protected)
- Atomic status updates
- Refreshes token before each sync to ensure validity

---

## Database Schema

### users table
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
email TEXT UNIQUE NOT NULL
created_at TIMESTAMP DEFAULT NOW()
```

### oauth_integrations table
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL REFERENCES users(id)
provider TEXT NOT NULL  -- "google"
email TEXT NOT NULL    -- Gmail account email
access_token TEXT NOT NULL
refresh_token TEXT NOT NULL  -- Persisted for offline access
token_type TEXT        -- "Bearer"
expiry TIMESTAMP       -- Token expiry time
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
UNIQUE (user_id, provider, email)
```

### transactions table
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL REFERENCES users(id)
amount DOUBLE PRECISION NOT NULL
type TEXT NOT NULL         -- "debited" or "credited"
account_last4 TEXT
merchant TEXT
name TEXT
reference_id TEXT UNIQUE NOT NULL  -- Prevents duplicates
occurred_at TIMESTAMP NOT NULL
created_at TIMESTAMP DEFAULT NOW()
```

### sync_state table
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL REFERENCES users(id)
provider TEXT NOT NULL  -- "gmail"
email TEXT NOT NULL UNIQUE
last_message_id TEXT   -- Gmail message ID cutoff
status TEXT DEFAULT 'idle'  -- "idle"|"syncing"|"completed"|"failed"
error TEXT             -- Error message if failed
updated_at TIMESTAMP DEFAULT NOW()
```

---

## Dependency Injection (main.go) - Initialization Order

1. **Load Config** from environment variables + `.env`
2. **Initialize PostgreSQL** connection pool via `db.NewPostgres()`
3. **Create SQLC Queries** wrapper: `sqlc.New(postgresDB)`
4. **Instantiate Repositories** (all with `*sqlc.Queries`):
   - TransactionRepository
   - OAuthRepository
   - SyncStateRepository
   - UserRepository
5. **Instantiate Services**:
   - TransactionService (depends on TransactionRepository)
6. **Create OAuth Config** via `auth.NewGoogleOAuthConfig()`
7. **Instantiate Handlers**:
   - AuthHandler (depends on oauth config + all repositories)
   - TransactionHandler (depends on TransactionService)
   - SyncWorker (depends on all repositories + oauth config)
8. **Start SyncWorker** goroutine: `go syncWorker.Start(context.Background())`
9. **Setup Gin Router** and register routes
10. **Start HTTP Server** on configured port

---

## Code Patterns & Conventions

### Error Handling
- Use explicit error returns (Go style)
- Log errors before returning (when appropriate for debugging)
- Return sensible HTTP status codes from handlers (400, 401, 409, 500, etc.)

### Dependency Injection
- Constructor functions follow: `New{Type}(dependencies) *Type`
- Fields are unexported (lowercase)
- All dependencies injected at initialization (no globals)

### sqlc Usage
- Use `:exec` for insert queries with ON CONFLICT DO NOTHING
- Use `pgtype.Text` and `pgtype.Timestamp` for nullable fields
- Queries stored in `internal/db/queries/*.sql`
- Generated code in `internal/db/sqlc/` (auto-generated, don't edit)
- Run `sqlc generate` after adding/modifying queries

### Context Usage
- Pass context through all service methods
- Respect context cancellation for timeouts
- Use `context.Background()` only where appropriate (worker start)

### Database Patterns
- OAuth tokens: store access_token, refresh_token, expiry (all persisted)
- Sync state: track last_message_id per provider/email for incremental sync
- Use UNIQUE constraints with ON CONFLICT for idempotency
- Include created_at/updated_at timestamps for audit trails

### Gmail Integration Pattern
```
1. Load OAuth token from DB via OAuthRepository
2. Auto-refresh using auth.RefreshToken()
3. Persist refreshed token back to DB
4. Create Gmail client via gmail.NewClient()
5. Execute Gmail API query via gmail.Service.Users.Messages.List()
6. Stop processing at previous last_message_id
7. Parse transaction emails via parsers
8. Persist to DB with ON CONFLICT (reference_id) DO NOTHING
9. Update sync_state with newest message_id
```

---

## File Organization

When adding new features:
- **Migrations:** `internal/db/migrations/{number}_{description}.sql` (numbered sequentially)
- **Queries:** `internal/db/queries/{entity}.sql` with clear method signatures in comments
- **Generate:** Run `sqlc generate` after new queries
- **Repository:** Create in `internal/repositories/{entity}_repository.go` if persistence needed
- **Service:** Create in `internal/services/{feature}.go` for business logic
- **Handler:** Create in `internal/api/{feature}_handler.go` to expose via HTTP
- **Routes:** Register in `main.go` router setup section

### Adding a new API endpoint

1. Create SQL query in `internal/db/queries/{entity}.sql`
2. Run `sqlc generate` (generates sqlc/{entity}.sql.go)
3. Create repository method in `internal/repositories/{entity}_repository.go`
4. Create service method in `internal/services/{feature}.go`
5. Create handler method in `internal/api/{feature}_handler.go`
6. Create handler constructor injecting dependencies
7. Register route in `main.go` router: `router.GET("/path", handler.Method)`

### Adding database migrations

1. Create numbered migration: `internal/db/migrations/{number}_{description}.sql`
2. Use standard SQL (no goose syntax required for up migration)
3. For rollback: include `-- +goose Down` section
4. Apply: `goose -dir internal/db/migrations postgres $DATABASE_URL up`

### Adding a new external service integration (like Gmail)

1. Create integration in `internal/integrations/{service}/`:
   - `client.go` - API client factory
   - `service.go` - API interaction logic
   - Additional files as needed
2. Integration service only talks to external API (no DB access)
3. Create higher-level service in `internal/services/` that orchestrates
4. Service coordinates with repositories for persistence
5. Handlers call services, never integrations directly

---

## Architecture Decisions

### Gmail Sync via Message ID Cutoff (MVP)
- **Why:** Simpler than Gmail History API, sufficient for MVP
- **How:** Track `last_message_id` per user, stop processing when encountered
- **Pros:** No event streaming complexity, works with existing Gmail API
- **Cons:** Misses emails deleted before next sync
- **Future:** Migrate to `gmail_history_id` + Gmail History API when needed

### Token Refresh in Worker
- **Why:** Ensures fresh token before every sync
- **How:** Call `auth.RefreshToken()` in worker.process() before Gmail operations
- **Benefit:** Handles token expiry gracefully, persists refreshed token

### Queue-Based Sync Worker
- **Why:** Prevents sync storms and concurrent duplicate syncs
- **How:** Buffered channel job queue (capacity 100) with per-email status tracking
- **Benefit:** Async sync doesn't block HTTP handlers, rate-limiting built-in

---

## Watch For

- ❌ Business logic in handlers - move to services
- ❌ Database queries in services - use repositories
- ❌ HTTP concerns in services or repositories
- ❌ Direct database access bypassing sqlc
- ❌ Unrefreshed OAuth tokens at sync time
- ✅ Clear separation of concerns
- ✅ Testable layers with injected dependencies
- ✅ Reusable repositories and services
- ✅ Token refresh before external API calls

---

## Next Priorities

When suggesting features, keep in mind the roadmap:

- **Background sync jobs** - Worker pattern started; consider cron scheduling (leverage existing worker)
- **Multiple bank support** - Extend parsers for ICICI, Axis, etc.; add provider column to sync_state
- **Transaction normalization** - Add to TransactionService; standardize amounts, dates, merchant names
- **User/account modeling** - Review `migrations/004_users.sql`; implement account abstraction layer
- **Observability** - Add structured logging (zap), tracing (otel), metrics (prometheus)
- **Pagination/filtering** - Add limit/offset to repository queries and handlers
- **Dockerization** - Multi-stage Docker builds; docker-compose for dev
- **Testing** - Unit tests for parsers, integration tests for handlers, mock Gmail API

---

## When to Break Rules

- Pragmatic shortcuts are OK for MVP features
- Note technical debt with comments (`// TODO:`, `// HACK:`, `// NOTE:`)
- Discuss deferred decisions (e.g., Gmail History API deferred for later)
- Seek balance between perfect architecture and shipping features
