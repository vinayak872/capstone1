.PHONY: help setup start stop test lint build deploy status baseline progressive failure experiment evidence cleanup demo

SHELL := /bin/bash

help: ## Show this help message
	@echo "=========================================================="
	@echo "  CLOUD-05: GitOps CI/CD with Progressive Delivery        "
	@echo "=========================================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

setup: ## Full automated setup: cluster, images, Argo CD, Rollouts, Prometheus
	./scripts/setup.sh

start: ## Start kind cluster if stopped
	./scripts/create-cluster.sh

stop: ## Pause or stop local cluster (or cleanup)
	@echo "Cluster is managed via Docker Desktop containers."

test: ## Run application automated unit and integration tests
	cd app && npm test

lint: ## Run code linter
	cd app && npm run lint

build: ## Build Docker container images (1.0.0, 2.0.0, 3.0.0)
	./scripts/build.sh

deploy: ## Deploy baseline application v1.0.0
	./scripts/deploy-baseline.sh 1.0.0

status: ## Inspect cluster pods, rollouts, and services
	@echo "=== Pods in cloud05 ==="
	kubectl get pods -n cloud05 -o wide
	@echo "=== Rollouts ==="
	kubectl get rollout -n cloud05 || true
	@echo "=== Deployments ==="
	kubectl get deployment -n cloud05 || true
	@echo "=== Services ==="
	kubectl get svc -n cloud05

baseline: ## Deploy healthy baseline update (v2.0.0)
	./scripts/deploy-baseline.sh 2.0.0

progressive: ## Deploy progressive delivery rollout (v1.0.0 or v2.0.0)
	./scripts/deploy-progressive.sh 2.0.0

failure: ## Inject runtime failure mode (default: error rate 0.75)
	./scripts/inject-failure.sh error 0.75

experiment: ## Execute automated experiment matrix and record results
	./scripts/run-experiment.sh

evidence: ## Collect real timestamped logs, metrics, and state into evidence/
	./scripts/collect-evidence.sh

cleanup: ## Safely remove kind cluster and temporary containers
	./scripts/cleanup.sh

demo: ## Run the interactive reviewer/viva demonstration
	./scripts/demo.sh
