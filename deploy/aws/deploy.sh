#!/usr/bin/env bash
# Release the current commit to the ECS stack defined in this directory.
#
#   AWS_REGION=us-east-1 deploy/aws/deploy.sh            # deploys HEAD
#   AWS_REGION=us-east-1 deploy/aws/deploy.sh <git-sha>  # redeploys/rolls back to an already-pushed sha
#
# Steps: build + push images (skipped when the tag already exists) → register
# new task definition revisions → run the migrate task and require exit 0 →
# roll the services → record the tag in SSM → wait for the services to settle.
#
# Needs: aws CLI v2, docker with buildx, jq, git. Run from anywhere in the repo.
# Written for the bash 3.2 that macOS ships (no associative arrays).
set -euo pipefail

: "${AWS_REGION:?set AWS_REGION}"
NAME="${FRONTSTEAD_NAME:-frontstead}"
CLUSTER="$NAME"

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [[ $# -ge 1 ]]; then
  TAG="$1"
else
  if [[ -n "$(git status --porcelain)" && "${ALLOW_DIRTY:-}" != "1" ]]; then
    echo "Working tree is dirty; commit first or set ALLOW_DIRTY=1." >&2
    exit 1
  fi
  TAG="$(git rev-parse --short=12 HEAD)"
fi

ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
REGISTRY="$ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com"
log() { printf '\n==> %s\n' "$*"; }

# ─── 1. Images ─────────────────────────────────────────────────────────────────
dockerfile() {
  case "$1" in
    mls) echo apps/mls-service/Dockerfile ;;
    *) echo "apps/$1/Dockerfile" ;;
  esac
}

aws ecr get-login-password --region "$AWS_REGION" |
  docker login --username AWS --password-stdin "$REGISTRY" >/dev/null

for app in api portal mls; do
  repo="$NAME-$app"
  if aws ecr describe-images --region "$AWS_REGION" --repository-name "$repo" \
      --image-ids imageTag="$TAG" >/dev/null 2>&1; then
    log "$repo:$TAG already pushed"
    continue
  fi
  if [[ $# -ge 1 && "$TAG" != "$(git rev-parse --short=12 HEAD)" ]]; then
    echo "$repo:$TAG is not in ECR and is not HEAD; check out that commit to build it." >&2
    exit 1
  fi
  log "Building $repo:$TAG"
  docker buildx build --platform linux/arm64 --push \
    -f "$(dockerfile "$app")" -t "$REGISTRY/$repo:$TAG" .
done

# ─── 2. Task definitions ───────────────────────────────────────────────────────
# Copy the latest revision of a family with every image retagged to $TAG.
register() {
  local family="$1" file
  file="$(mktemp)"
  aws ecs describe-task-definition --region "$AWS_REGION" --task-definition "$family" \
    --query taskDefinition --output json |
    jq --arg tag "$TAG" '
      .containerDefinitions |= map(.image |= sub(":[^:/]+$"; ":" + $tag))
      | del(.taskDefinitionArn, .revision, .status, .requiresAttributes,
            .compatibilities, .registeredAt, .registeredBy, .deregisteredAt)' >"$file"
  aws ecs register-task-definition --region "$AWS_REGION" --cli-input-json "file://$file" \
    --query taskDefinition.taskDefinitionArn --output text
  rm -f "$file"
}

log "Registering task definitions for $TAG"
ARNS="$(mktemp -d)"
trap 'rm -rf "$ARNS"' EXIT
for family in $(aws ecs list-task-definition-families --region "$AWS_REGION" \
    --family-prefix "$NAME-" --status ACTIVE --query 'families[]' --output text); do
  register "$family" >"$ARNS/$family"
  echo "  $(cat "$ARNS/$family")"
done
arn() { cat "$ARNS/$NAME-$1"; }

# ─── 3. Migrations ─────────────────────────────────────────────────────────────
log "Running database migrations"
# The MLS service has the worker network settings (DB access, no inbound).
NETWORK="$(aws ecs describe-services --region "$AWS_REGION" --cluster "$CLUSTER" --services mls \
  --query 'services[0].networkConfiguration' --output json)"
TASK="$(aws ecs run-task --region "$AWS_REGION" --cluster "$CLUSTER" --launch-type FARGATE \
  --task-definition "$(arn migrate)" --network-configuration "$NETWORK" \
  --query 'tasks[0].taskArn' --output text)"
aws ecs wait tasks-stopped --region "$AWS_REGION" --cluster "$CLUSTER" --tasks "$TASK"
EXIT_CODE="$(aws ecs describe-tasks --region "$AWS_REGION" --cluster "$CLUSTER" --tasks "$TASK" \
  --query 'tasks[0].containers[0].exitCode' --output text)"
if [[ "$EXIT_CODE" != "0" ]]; then
  echo "Migration task exited with '$EXIT_CODE'; services not updated. Logs: /ecs/$NAME/migrate" >&2
  exit 1
fi

# ─── 4. Services ───────────────────────────────────────────────────────────────
log "Rolling services"
for svc in api portal mls; do
  aws ecs update-service --region "$AWS_REGION" --cluster "$CLUSTER" --service "$svc" \
    --task-definition "$(arn "$svc")" --query 'service.serviceName' --output text >/dev/null
  echo "  $svc → $(arn "$svc" | sed 's#.*/##')"
done

aws ssm put-parameter --region "$AWS_REGION" --name "/$NAME/image-tag" --value "$TAG" \
  --type String --overwrite >/dev/null

log "Waiting for services to stabilize"
aws ecs wait services-stable --region "$AWS_REGION" --cluster "$CLUSTER" --services api portal mls
log "Deployed $TAG"
