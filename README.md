# MergeProof

MergeProof is a self-hosted GitHub App that checks pull requests before maintainers spend review time on them.

It listens to GitHub webhooks, stores every delivery, syncs installations, repositories, and pull requests into Postgres, then publishes a deterministic `mergeproof/evidence-gate` check run on supported PR events.

MergeProof is currently alpha software. It is useful for testing the self-hosted workflow and deterministic PR evidence checks, but it is not a complete merge-gating product yet.

## Problem

Maintainers often receive pull requests without enough context to review safely. The code might be fine, but the PR body may not explain what changed, why it changed, how it was tested, what risk exists, or whether AI assistance was used.

MergeProof gives maintainers an early, repeatable signal before review starts. It does not judge code quality yet. It checks whether the PR includes the minimum review evidence a maintainer needs.

## Current alpha features

- GitHub App webhook intake with HMAC signature verification
- Raw webhook storage in Postgres
- Installation and repository sync
- Pull request sync
- GitHub check run creation and updates
- Deterministic PR body evidence evaluation
- Duplicate check prevention for repeated PR body edits on the same commit SHA
- Local dashboard showing webhook, installation, repository, PR, and check-run counts

## How it works

1. GitHub sends a webhook to MergeProof.
2. The Next.js webhook route verifies the GitHub signature.
3. MergeProof stores the raw delivery in `WebhookEvent`.
4. Supported events are processed into structured Prisma models.
5. Supported PR events evaluate the PR body.
6. MergeProof creates or updates `mergeproof/evidence-gate` on the PR head SHA.

See [docs/architecture.md](docs/architecture.md) for the short architecture overview.

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Docker Compose
- GitHub App webhooks
- Octokit

## Local development

Install dependencies:

```bash
npm install
```

Create a local `.env`:

```bash
cp .env.example .env
```

Fill in the GitHub App values:

```env
DATABASE_URL="postgresql://mergeproof:mergeproof@localhost:5432/mergeproof"
GITHUB_APP_ID=""
GITHUB_PRIVATE_KEY=""
GITHUB_WEBHOOK_SECRET=""
APP_URL="http://localhost:3000"
```

Start Postgres:

```bash
docker compose up -d
```

Run migrations and generate the Prisma client:

```bash
npx prisma migrate dev
npx prisma generate
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## GitHub App setup

Create your own GitHub App for self-hosted use. At minimum, configure:

- Webhook URL: your public URL ending in `/api/github/webhook`
- Webhook secret: same value as `GITHUB_WEBHOOK_SECRET`
- Repository permissions:
  - Metadata: read
  - Contents: read
  - Pull requests: read
  - Checks: read and write
  - Issues: read and write
- Webhook events:
  - Pull request
  - Installation and repository-related events if available
  - Issue comment can be enabled later, but MergeProof does not process it yet

Generate a private key and put the full PEM in `GITHUB_PRIVATE_KEY`. The SHA256 fingerprint shown in GitHub settings is not the private key.

See [docs/github-app-setup.md](docs/github-app-setup.md) for exact setup steps.

## Testing with Smee

For local development, GitHub cannot send webhooks directly to `localhost`. Use Smee as a webhook relay.

Set your GitHub App webhook URL to your Smee channel, for example:

```text
https://smee.io/mergeproof-dev
```

Forward Smee deliveries to your local webhook route:

```bash
npx smee-client --url https://smee.io/mergeproof-dev --target http://localhost:3000/api/github/webhook
```

Then open or edit a PR in a repository where the app is installed.

## Triggering a PR check

Open or edit a pull request with a body that includes:

```md
## What changed

## Why

## Proof

## Risk

## AI assistance
```

MergeProof evaluates the PR body and creates or updates `mergeproof/evidence-gate`.

See [docs/pr-template.md](docs/pr-template.md) for the accepted section aliases and scoring rules.

## Current limitations

- No AI evaluation
- No PR comments
- No changed-file analysis
- No CI signal ingestion
- No hosted SaaS mode
- No `check_run.rerequested` or `check_suite.rerequested` handling
- Evidence scoring only reads the PR title and body
- Check-run output is deterministic and intentionally basic

## Roadmap

- Add changed-file evidence checks
- Update check runs from richer deterministic signals
- Add maintainer-facing review summaries
- Add optional PR comments
- Add policy configuration
- Add AI-assisted review questions after deterministic foundations are stable

## Documentation

- [Self-hosting guide](docs/self-hosting.md)
- [GitHub App setup](docs/github-app-setup.md)
- [Recommended PR template](docs/pr-template.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Architecture](docs/architecture.md)

## License

MergeProof is licensed under the Apache License 2.0. See [LICENSE](LICENSE).
