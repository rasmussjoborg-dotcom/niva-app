# ── Stage 1: Install dependencies ───────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ── Stage 2: Production image ────────────────────────
FROM oven/bun:1
WORKDIR /app

# Copy deps from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY . .

# Build frontend
RUN bun run build

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port (Railway sets PORT env var)
EXPOSE 3002

CMD ["bun", "run", "index.ts"]
