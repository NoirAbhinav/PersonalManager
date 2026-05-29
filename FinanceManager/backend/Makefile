DB_URL=postgres://consoleuser:buddy123@localhost:5432/console?sslmode=disable

migrate-up:
	goose -dir internal/db/migrations postgres "$(DB_URL)" up

migrate-down:
	goose -dir internal/db/migrations postgres "$(DB_URL)" down

migrate-status:
	goose -dir internal/db/migrations postgres "$(DB_URL)" status

sqlc:
	sqlc generates