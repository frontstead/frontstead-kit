# syntax=docker/dockerfile:1
# Build from monorepo root: docker build -f apps/api/Dockerfile .

FROM node:22.12-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

FROM base AS deps
COPY . .
RUN npm ci

FROM base AS builder
COPY --from=deps /app /app
# `prisma generate` loads packages/db/prisma.config.ts, whose datasource reads
# env('DATABASE_URL') — and that helper throws when the variable is unset, so
# the build failed here with "Cannot resolve environment variable: DATABASE_URL".
#
# Generation never connects to a database; it only needs a syntactically valid
# URL. This placeholder cannot reach the running container: it is scoped to this
# stage, the runner below starts from a fresh image and copies only /app, and
# the client resolves its real connection string at runtime from
# process.env.DATABASE_URL (see packages/db/index.ts, which constructs PrismaPg
# lazily on first use rather than baking a URL into the generated client).
ARG DATABASE_URL=postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build --workspace=db

FROM node:22.12-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat

RUN addgroup -g 1001 -S nodejs && adduser -S api -u 1001

# Amazon RDS CA bundle, so connection strings can verify RDS certificates; see
# docs/AWS_ECS.md (node-pg and Prisma migrate name it differently). Harmless
# elsewhere: nothing reads it unless the URL names it. If AWS rotates the
# bundle, update the checksum (curl the URL and `shasum -a 256` it).
ADD --chmod=644 --checksum=sha256:fe45bbebf92ad3e27a583bbb2ddd1553c521ed4d49af5514dc0a40372ea5395c \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /etc/ssl/certs/rds-global-bundle.pem

COPY --from=builder --chown=api:nodejs /app /app

USER api
WORKDIR /app/apps/api

ENV API_PORT=3001
EXPOSE 3001

# node is PID 1 directly (not npm) so SIGTERM reaches the server's shutdown handler.
CMD ["node", "--import", "tsx", "src/server.ts"]
