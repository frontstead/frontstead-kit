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
RUN npm run build --workspace=db

FROM node:22.12-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV LOG_LEVEL=info
RUN apk add --no-cache openssl libc6-compat

RUN addgroup -g 1001 -S nodejs && adduser -S mlsservice -u 1001

# Amazon RDS CA bundle, so DATABASE_URL can verify RDS certificates; see
# docs/AWS_ECS.md. Harmless elsewhere: nothing reads it unless the URL names it. If AWS rotates the
# bundle, update the checksum (curl the URL and `shasum -a 256` it).
ADD --chmod=644 --checksum=sha256:fe45bbebf92ad3e27a583bbb2ddd1553c521ed4d49af5514dc0a40372ea5395c \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /etc/ssl/certs/rds-global-bundle.pem

COPY --from=builder --chown=mlsservice:nodejs /app /app

USER mlsservice
WORKDIR /app/apps/mls-service

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('MLS Service Health Check: OK')" || exit 1

# node is PID 1 directly (not npm) so SIGTERM reaches the worker's shutdown handler.
CMD ["node", "--import", "tsx", "src/index.ts"]

LABEL maintainer="Frontstead Team"
LABEL description="MLS Data Synchronization Service"
