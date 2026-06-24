# =============================================================================
# DataPilotAI Server — Multi-Stage Production Dockerfile
# =============================================================================
# Stage 1 (deps):     Install ALL dependencies (including devDeps for build)
# Stage 2 (builder):  Compile TypeScript → JavaScript via tsup
# Stage 3 (runner):   Lean production image — only runtime deps + built output
# =============================================================================

# ── Base image ────────────────────────────────────────────────────────────────
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /app

# System libraries required by native Node modules:
#   canvas  → cairo, pango, jpeg, giflib, pixman
#   tesseract.js → runs in WASM (no native libs needed in Alpine)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pkgconfig


# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM base AS deps

COPY package*.json ./

# Install ALL deps (dev + prod) needed for the TypeScript build
RUN npm ci --ignore-scripts=false


# ── Stage 2: Builder ──────────────────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Compile TypeScript → ESM JavaScript
RUN npm run build

# Prune devDependencies — keep only production deps for the final image
RUN npm ci --omit=dev --ignore-scripts=false


# ── Stage 3: Production Runner ────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

# Runtime-only native libraries (smaller than -dev variants)
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    && rm -rf /var/cache/apk/*

# Non-root user for security
RUN addgroup -g 1001 -S appgroup \
    && adduser -S appuser -u 1001 -G appgroup

# Copy build artifacts from builder stage
COPY --from=builder --chown=appuser:appgroup /app/dist        ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

# Tesseract English language data (required at runtime for OCR)
COPY --from=builder --chown=appuser:appgroup /app/eng.traineddata ./

USER appuser

EXPOSE 5000

# Health check — polls the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "\
        const http = require('http'); \
        http.get('http://localhost:5000/api/health', (r) => \
            r.statusCode === 200 ? process.exit(0) : process.exit(1) \
        ).on('error', () => process.exit(1)); \
    "

CMD ["node", "dist/server.js"]
