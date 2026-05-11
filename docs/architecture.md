# Architecture

MergeProof is currently a small self-hosted GitHub App pipeline.

```text
GitHub webhook
  -> Next.js route: /api/github/webhook
  -> signature verification
  -> raw WebhookEvent storage
  -> event processor
  -> Prisma/Postgres
  -> GitHub check run create/update
```

## Core flow

1. GitHub sends a signed webhook delivery.
2. The Next.js route reads the raw request body and verifies `x-hub-signature-256`.
3. The raw payload is stored in `WebhookEvent`.
4. Supported events are processed into structured tables:
   - `Installation`
   - `Repository`
   - `PullRequest`
   - `CheckRun`
5. PR body evidence is evaluated deterministically and PR changed files are fetched from GitHub.
6. MergeProof creates or updates `mergeproof/evidence-gate` on the PR head SHA.

## Current processors

- `ping`
- `installation.created`
- `installation.deleted`
- `installation_repositories.added`
- `installation_repositories.removed`
- `pull_request.opened`
- `pull_request.edited`
- `pull_request.reopened`
- `pull_request.synchronize`
- `pull_request.ready_for_review`
- `pull_request.closed`

## Data model

- `WebhookEvent` keeps the raw delivery log and processing state.
- `Installation` stores GitHub App installations.
- `Repository` stores repositories available to an installation.
- `PullRequest` stores PR metadata and current head SHA.
- `CheckRun` stores MergeProof check-run IDs and conclusions.

## Design constraint

The current product is deterministic. It does not call AI providers or post PR comments. It does inspect changed files from GitHub PR metadata.
