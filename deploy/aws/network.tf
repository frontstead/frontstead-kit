# Two AZs, public subnets for the ALB and Fargate tasks (public IPs instead of a
# NAT gateway), private subnets for RDS only. Security groups do the isolation:
# nothing but the ALB accepts traffic from the internet.

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = var.name }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = var.name }
}

resource "aws_subnet" "public" {
  count                   = length(local.azs)
  vpc_id                  = aws_vpc.main.id
  availability_zone       = local.azs[count.index]
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  map_public_ip_on_launch = true

  tags = { Name = "${var.name}-public-${local.azs[count.index]}" }
}

resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  availability_zone = local.azs[count.index]
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)

  tags = { Name = "${var.name}-private-${local.azs[count.index]}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.name}-public" }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ─── Security groups ───────────────────────────────────────────────────────────

resource "aws_security_group" "alb" {
  name        = "${var.name}-alb"
  description = "Public HTTP/HTTPS to the load balancer"
  vpc_id      = aws_vpc.main.id
}

resource "aws_security_group" "portal" {
  name        = "${var.name}-portal"
  description = "Portal tasks; reachable only from the ALB"
  vpc_id      = aws_vpc.main.id
}

resource "aws_security_group" "api" {
  name        = "${var.name}-api"
  description = "API tasks; reachable only from portal tasks via Service Connect"
  vpc_id      = aws_vpc.main.id
}

resource "aws_security_group" "worker" {
  name        = "${var.name}-worker"
  description = "MLS worker, migrate and cron tasks; no inbound traffic"
  vpc_id      = aws_vpc.main.id
}

resource "aws_security_group" "db" {
  name        = "${var.name}-db"
  description = "PostgreSQL; reachable only from API and worker tasks"
  vpc_id      = aws_vpc.main.id
}

resource "aws_vpc_security_group_ingress_rule" "alb" {
  for_each          = toset(["80", "443"])
  security_group_id = aws_security_group.alb.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = tonumber(each.key)
  to_port           = tonumber(each.key)
}

resource "aws_vpc_security_group_ingress_rule" "portal_from_alb" {
  security_group_id            = aws_security_group.portal.id
  referenced_security_group_id = aws_security_group.alb.id
  ip_protocol                  = "tcp"
  from_port                    = 3006
  to_port                      = 3006
}

resource "aws_vpc_security_group_ingress_rule" "api_from_portal" {
  security_group_id            = aws_security_group.api.id
  referenced_security_group_id = aws_security_group.portal.id
  ip_protocol                  = "tcp"
  from_port                    = 3001
  to_port                      = 3001
}

resource "aws_vpc_security_group_ingress_rule" "db" {
  for_each = {
    api    = aws_security_group.api.id
    worker = aws_security_group.worker.id
  }
  security_group_id            = aws_security_group.db.id
  referenced_security_group_id = each.value
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

# Tasks pull images, reach Secrets Manager, S3, Resend and MLS providers over
# the internet gateway, so egress stays open.
resource "aws_vpc_security_group_egress_rule" "all" {
  for_each = {
    alb    = aws_security_group.alb.id
    portal = aws_security_group.portal.id
    api    = aws_security_group.api.id
    worker = aws_security_group.worker.id
  }
  security_group_id = each.value
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}
