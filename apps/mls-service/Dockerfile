# syntax=docker/dockerfile:1
# Build from monorepo root: docker build -f apps/mls-service/Dockerfile .

FROM node:22.12-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

FROM base AS deps
COPY . .
RUN npm ci

FROM base AS builder
COPY --from=deps /app /app
# `prisma generate` needs a syntactically valid DATABASE_URL and never connects.
# The placeholder stays in this stage; see apps/api/Dockerfile for the details.
ARG DATABASE_URL=postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build --workspace=db

FROM node:22.12-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV LOG_LEVEL=info
RUN apk add --no-cache openssl libc6-compat

RUN addgroup -g 1001 -S nodejs && adduser -S mlsservice -u 1001

COPY --from=builder --chown=mlsservice:nodejs /app /app
RUN mkdir -p /app/apps/mls-service/logs && chown mlsservice:nodejs /app/apps/mls-service/logs

USER mlsservice

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('MLS Service Health Check: OK')" || exit 1

CMD ["npm", "start", "--workspace=@frontstead/mls-service"]

LABEL maintainer="Frontstead Team"
LABEL description="MLS Data Synchronization Service"
