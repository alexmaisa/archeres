# Stage 1: Compile the Go binary
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Pre-cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code and build statically
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o main main.go

# Stage 2: Minimal runtime image
FROM alpine:3.19

WORKDIR /app

# Copy the pre-compiled binary
COPY --from=builder /app/main .

# Expose backend REST API port
EXPOSE 8080

# Production default configurations (overridden by compose)
ENV PORT=8080
ENV DATABASE_PATH=/app/data/arche.db
ENV JWT_SECRET=supersecretjwtkeyforarche2026

# Create a secure non-privileged system group and user
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

# Ensure data directory for persistent SQLite volume is available and owned by appuser
RUN mkdir -p /app/data && \
    chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

# Run binary
CMD ["./main"]
