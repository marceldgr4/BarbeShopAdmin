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

RUN npm prune --production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/appointments/dist ./dist
USER node
EXPOSE 3006
CMD ["node", "dist/index.js"]
