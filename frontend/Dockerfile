# Multi-stage image for the Notes frontend.
#
# Targets:
#   dev    — full node_modules + Next.js dev server (Fast Refresh).
#            Used by docker-compose.yml with a bind mount.
#   runner — slim prod runtime: Next.js `standalone` output only (traced
#            node_modules + static assets), run with `node server.js`.
#            Used by docker-compose.prod.yml.

# --- Dev image -------------------------------------------------------------
FROM node:20-slim AS dev

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

# --- Deps: install full dependency graph for the build ---------------------
FROM node:20-slim AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Builder: produce the standalone output --------------------------------
FROM node:20-slim AS builder

WORKDIR /app

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so the
# browser-facing API URL must be present here, not just at runtime.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Runner: minimal production runtime ------------------------------------
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# Copy only what the standalone server needs.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
