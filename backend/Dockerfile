FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json ./
RUN bun install --frozen-lockfile || bun install

# Build binary
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun build ./src/index.ts --compile --outfile server

# Production image
FROM oven/bun:1-alpine AS prod
WORKDIR /app

COPY --from=build /app/server /app/server
COPY --from=build /app/public /app/public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["./server"]
