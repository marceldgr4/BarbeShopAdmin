# Multi-stage build — used by all microservices
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json ./
COPY tsconfig.base.json ./

# Copy shared package
COPY packages/shared ./packages/shared

# Copy the specific service (passed via build context)
COPY services/${SERVICE_NAME} ./services/${SERVICE_NAME}

# Install all deps
RUN npm install --workspace=packages/shared
RUN npm install --workspace=services/${SERVICE_NAME}

# Build shared first, then the service
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/${SERVICE_NAME}

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/${SERVICE_NAME}/dist ./dist
COPY --from=builder /app/services/${SERVICE_NAME}/package.json ./

RUN npm install --production

USER node

EXPOSE ${PORT:-3000}

CMD ["node", "dist/index.js"]
