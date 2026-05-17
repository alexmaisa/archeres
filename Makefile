.PHONY: install run-backend run-frontend run test clean

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

run:
	@echo "Starting both backend and frontend concurrently..."
	@echo "Please make sure ports 8080 and 3000 are unoccupied."
	(cd backend && PORT=8080 DATABASE_PATH=arche.db JWT_SECRET=supersecretjwtkeyforarche2026 go run main.go) & \
	(cd frontend && pnpm run dev)

test:
	@echo "Running backend mathematical tests..."
	cd backend && go test -v ./utils

clean:
	@echo "Cleaning temporary local database and build folders..."
	rm -f backend/arche.db
	rm -rf frontend/.next frontend/out
