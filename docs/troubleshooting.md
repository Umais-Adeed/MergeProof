# Troubleshooting

## Smee is not forwarding

Make sure the Smee client targets the webhook route, not the app root:

```bash
npx smee-client --url https://smee.io/mergeproof-dev --target http://localhost:3001/api/github/webhook
```

Also confirm your GitHub App webhook URL is the same Smee URL.

## Webhook returns 401

A `401` means signature verification failed or required webhook configuration is missing.

Check:

- `GITHUB_WEBHOOK_SECRET` exists in `.env`
- the GitHub App webhook secret matches `GITHUB_WEBHOOK_SECRET`
- `npm run dev` was restarted after changing `.env`
- the request includes `x-hub-signature-256`

## Webhook returns 500

A `500` means the webhook was verified but processing failed.

Check the app logs and the latest `WebhookEvent.error` value:

```sql
select "eventName","action","processed","error","createdAt"
from "WebhookEvent"
order by "createdAt" desc
limit 20;
```

## GitHub App is not installed on the repo

MergeProof can receive some app-level events even when the test PR repository is not included in the installation. If PR checks do not appear, confirm the app is installed on the exact repository used for testing.

## App has access to the wrong repo

In the GitHub App installation settings, choose selected repositories and verify the intended test repository is selected.

Then trigger an installation repository event by adding or removing a repository from the installation.

## `GITHUB_PRIVATE_KEY` is a SHA fingerprint

This is not valid:

```text
SHA256:...
```

Use the full downloaded PEM:

```env
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

## Prisma client is stale after a schema change

Regenerate it:

```bash
npx prisma generate
```

If migrations are pending:

```bash
npx prisma migrate dev
```

## Docker Postgres is not running

Start it:

```bash
docker compose up -d
```

Check the container:

```bash
docker ps
```

## Check run is not appearing

Check:

- the app is installed on the PR repository
- Checks permission is read and write
- `GITHUB_APP_ID` is correct
- `GITHUB_PRIVATE_KEY` is a valid PEM
- `pull_request` events are enabled
- Pull requests permission is read-only or better so MergeProof can list changed files
- the latest `WebhookEvent.error` is empty

## Duplicate checks or old migrations

MergeProof uses `pullRequestId + check name + headSha` to update the existing evidence check for repeated PR body edits on the same commit.

If duplicates persist, confirm the `CheckRun` table has `headSha` and the deduplication migration has run:

```bash
npx prisma migrate dev
```

## Localhost cannot be used directly as GitHub webhook URL

GitHub cannot deliver webhooks to `http://localhost:3001` directly. For local development, use Smee or another public tunnel. In production, use a public HTTPS URL.
