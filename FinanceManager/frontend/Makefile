.PHONY: install dev build preview clean lint help

help:
	@echo "PersonalManager Frontend - Available Commands"
	@echo ""
	@echo "  make install    Install dependencies"
	@echo "  make dev        Start development server"
	@echo "  make build      Build for production"
	@echo "  make preview    Preview production build"
	@echo "  make clean      Clean build artifacts"
	@echo "  make lint       Run ESLint"
	@echo ""

install:
	npm install

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

clean:
	rm -rf dist node_modules .turbo

lint:
	npm run lint

.DEFAULT_GOAL := help
