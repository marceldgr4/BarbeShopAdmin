#!/bin/bash

echo "🔨 Generando Dockerfiles..."

# Gateway
cat > gateway/Dockerfile << 'DOCKERFILE'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY gateway ./gateway
RUN npm install --workspace=packages/shared
RUN npm install --workspace=gateway
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=gateway

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/gateway/dist ./dist
COPY --from=builder /app/gateway/package.json ./
RUN npm install --production
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
DOCKERFILE

echo "✓ gateway/Dockerfile"

# Barbershops
cat > services/barbershops/Dockerfile << 'DOCKERFILE'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/barbershops ./services/barbershops
RUN npm install --workspace=packages/shared
RUN npm install --workspace=services/barbershops
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/barbershops

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/barbershops/dist ./dist
COPY --from=builder /app/services/barbershops/package.json ./
RUN npm install --production
USER node
EXPOSE 3001
CMD ["node", "dist/index.js"]
DOCKERFILE

echo "✓ services/barbershops/Dockerfile"

# Barbers
cat > services/barbers/Dockerfile << 'DOCKERFILE'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/barbers ./services/barbers
RUN npm install --workspace=packages/shared
RUN npm install --workspace=services/barbers
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/barbers

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/barbers/dist ./dist
COPY --from=builder /app/services/barbers/package.json ./
RUN npm install --production
USER node
EXPOSE 3002
CMD ["node", "dist/index.js"]
DOCKERFILE

echo "✓ services/barbers/Dockerfile"

# Services
cat > services/services-svc/Dockerfile << 'DOCKERFILE'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/services-svc ./services/services-svc
RUN npm install --workspace=packages/shared
RUN npm install --workspace=services/services-svc
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/services-svc

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/services-svc/dist ./dist
COPY --from=builder /app/services/services-svc/package.json ./
RUN npm install --production
USER node
EXPOSE 3003
CMD ["node", "dist/index.js"]
DOCKERFILE

echo "✓ services/services-svc/Dockerfile"

# Schedules
cat > services/schedules/Dockerfile << 'DOCKERFILE'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/schedules ./services/schedules
RUN npm install --workspace=packages/shared
RUN npm install --workspace=services/schedules
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/schedules

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/schedules/dist ./dist
COPY --from=builder /app/services/schedules/package.json ./
RUN npm install --production
USER node
EXPOSE 3004
CMD ["node", "dist/index.js"]
DOCKERFILE

echo "✓ services/schedules/Dockerfile"

# Dashboard
cat > services/dashboard/Dockerfile << 'DOCKERFILE'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/dashboard ./services/dashboard
RUN npm install --workspace=packages/shared
RUN npm install --workspace=services/dashboard
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/dashboard

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/dashboard/dist ./dist
COPY --from=builder /app/services/dashboard/package.json ./
RUN npm install --production
USER node
EXPOSE 3005
CMD ["node", "dist/index.js"]
DOCKERFILE

echo "✓ services/dashboard/Dockerfile"

# Appointments
cat > services/appointments/Dockerfile << 'DOCKERFILE'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/appointments ./services/appointments
RUN npm install --workspace=packages/shared
RUN npm install --workspace=services/appointments
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/appointments

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/appointments/dist ./dist
COPY --from=builder /app/services/appointments/package.json ./
RUN npm install --production
USER node
EXPOSE 3006
CMD ["node", "dist/index.js"]
DOCKERFILE

echo "✓ services/appointments/Dockerfile"

echo ""
echo "✅ Todos los Dockerfiles creados exitosamente"
