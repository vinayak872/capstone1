# CLOUD-05: GitOps CI/CD with Progressive Delivery and Automated Rollback

This repository contains the complete, working, locally demonstrable implementation of the **CLOUD-05** Capstone Project (**Software Modelling and DevOps**).

The full codebase, scripts, manifests, experiments, and documentation are located in [`cloud05-release-safety/`](cloud05-release-safety/).

## Quick Commands (Run from workspace root)

```bash
# Validate prerequisites
make -C cloud05-release-safety check-prerequisites

# Automated full setup (Kind cluster, Docker images, Prometheus, Argo Rollouts, Argo CD)
make setup

# Run the live interactive reviewer demonstration
make demo

# Run automated experiments and collect metrics
make experiment

# Collect real timestamped evidence
make evidence

# Run application test suite
make test

# Teardown cluster safely
make cleanup
```

Please refer to [`cloud05-release-safety/README.md`](cloud05-release-safety/README.md) for full architectural documentation, experiment logs, and review guides.
