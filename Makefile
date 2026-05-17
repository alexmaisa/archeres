.PHONY: install run-backend run-frontend dev test stop clean help

# Colors for terminal styling
BLUE   := \033[36m
YELLOW := \033[33m
RESET  := \033[0m

help:
	@echo "$(BLUE)Available commands in this Makefile:$(RESET)"
	@echo "---------------------------------------------------------------------------------"
	@echo "  $(YELLOW)make install$(RESET)        Install all backend and frontend dependencies"
	@echo "  $(YELLOW)make dev$(RESET)            Run both backend and frontend concurrently in development mode"
	@echo "  $(YELLOW)make run-backend$(RESET)    Start only the backend local development server on port 8080"
	@echo "  $(YELLOW)make run-frontend$(RESET)   Start only the frontend local development server on port 3000"
	@echo "  $(YELLOW)make test$(RESET)           Run all backend mathematical precision unit tests"
	@echo "  $(YELLOW)make stop$(RESET)           Kill all local server processes occupying ports 3000 and 8080"
	@echo "  $(YELLOW)make clean$(RESET)          Clean temporary local databases and Next.js build outputs"
	@echo "  $(YELLOW)make help$(RESET)           Display this help guide with a description of all commands"
	@echo "---------------------------------------------------------------------------------"

install:
	@echo "Installing backend dependencies..."
	cd backend && go mod tidy
	@echo "Installing frontend dependencies..."
	cd frontend && pnpm install

run-backend:
	@echo "Starting backend local development server on port 8080..."
	cd backend && PORT=8080 DATABASE_PATH=arche.db JWT_SECRET=supersecretjwtkeyforarche2026 go run main.go

run-frontend:
	@echo "Starting frontend local development server on port 3000..."
	cd frontend && pnpm run dev

dev:
	@echo "Starting both backend and frontend concurrently..."
	@echo "Please make sure ports 8080 and 3000 are unoccupied."
	@(cd backend && PORT=8080 DATABASE_PATH=arche.db JWT_SECRET=supersecretjwtkeyforarche2026 go run main.go) & \
	(cd frontend && pnpm run dev)

test:
	@echo "Running backend mathematical tests..."
	cd backend && go test -v ./utils

stop:
	@echo "Stopping local development processes occupying ports 3000 and 8080..."
	@kill -9 $$(lsof -t -i :3000) 2>/dev/null || true
	@kill -9 $$(lsof -t -i :8080) 2>/dev/null || true
	@echo "Local development servers stopped and ports are unoccupied."

clean:
	@echo "Cleaning temporary local database and build folders..."
	rm -f backend/arche.db
	rm -rf frontend/.next frontend/out
