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
RUN npm prune --production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/services-svc/dist ./dist
USER node
EXPOSE 3003
CMD ["node", "dist/index.js"]
