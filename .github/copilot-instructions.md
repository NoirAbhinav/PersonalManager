Project: PersonalManager
Language: Go
Framework: Gin
DB: PostgreSQL
ORM/Queries: sqlc
Migrations: goose
Hosting target: Oracle Cloud Free Tier
Architecture style: layered clean architecture

Current backend structure:

backend/
├── cmd/server
├── internal/
│   ├── api/
│   ├── auth/
│   ├── config/
│   ├── db/
│   │   ├── migrations/
│   │   ├── queries/
│   │   └── sqlc/
│   ├── integrations/
│   │   └── gmail/
│   ├── parsers/
│   ├── repositories/
│   ├── services/
│   ├── jobs/
│   └── utils/
├── .env
├── go.mod

Current functionality implemented:
- Google OAuth login flow
- Gmail readonly integration
- Gmail email fetcher
- HTML body extraction from Gmail MIME payload
- HDFC transaction email parser
- PostgreSQL persistence
- Token persistence
- Incremental sync groundwork
- Transactions API

Architecture:
handler -> service -> repository -> sqlc -> postgres

Implemented APIs:
- GET /health
- GET /auth/google/login
- GET /auth/google/callback
- POST /sync/gmail
- GET /transactions

OAuth flow:
- User logs in once via Google OAuth
- Refresh token stored in DB
- Future syncs use stored refresh token
- oauth2.TokenSource used to auto-refresh access tokens
- refreshed access token persisted back to DB

Tables implemented:
1. transactions
2. oauth_integrations
3. sync_state

transactions table:
- amount
- type
- account_last4
- merchant
- name
- reference_id UNIQUE
- occurred_at

oauth_integrations table:
- provider
- email
- access_token
- refresh_token
- token_type
- expiry

sync_state table currently uses:
- provider
- email
- last_message_id
- updated_at

Important architecture decisions:
- Gmail integration layer ONLY talks to Gmail API
- Business logic lives in services
- Persistence logic lives in repositories
- Handlers remain thin

Current Gmail sync approach:
- fetch latest emails from Gmail
- Gmail query:
  from:alerts@hdfcbank.bank.in
- latest emails returned newest-first
- sync service stops processing when last known message ID is encountered
- newest processed message ID saved into sync_state
- duplicate transaction inserts prevented using:
  ON CONFLICT (reference_id) DO NOTHING

Current sync flow:
1. Load OAuth token from DB
2. Refresh token if needed
3. Persist refreshed token
4. Create Gmail client
5. Fetch latest HDFC emails
6. Stop when previous last_message_id encountered
7. Parse transactions
8. Insert into DB
9. Save newest message ID

Gmail History API was discussed but intentionally deferred for now because:
- current MVP architecture is sufficient
- history API introduces event-stream complexity
- current message-id cutoff approach is acceptable for MVP

Current recommendation:
- keep current message-id cutoff incremental sync
- later migrate to gmail_history_id + Gmail History API

Current repositories:
- TransactionRepository
- OAuthRepository
- SyncStateRepository

Current services:
- GmailSyncService
- TransactionService

Important implementation details:
- sqlc queries use :exec for insert queries with ON CONFLICT DO NOTHING
- pgtype.Text and pgtype.Timestamp used for nullable postgres fields
- oauth2.AccessTypeOffline and oauth2.ApprovalForce used during login to force refresh token issuance

Deployment plan:
- Oracle Cloud Free Tier
- Prefer VM.Standard.A1.Flex (Ampere ARM)
- Ubuntu
- Docker + docker compose
- Nginx reverse proxy
- Future cron/background sync jobs

Git issue resolved:
- SSH keys were correct
- GitHub attribution issue caused by git user.email being set to office email
- repo-level git config fixed it

Current next likely priorities:
- background sync jobs
- multiple bank support
- transaction normalization
- user/account modeling
- frontend
- observability/logging
- pagination/filtering
- Dockerization