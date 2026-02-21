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
RUN npm prune --production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/barbershops/dist ./dist
USER node
EXPOSE 3001
CMD ["node", "dist/index.js"]
