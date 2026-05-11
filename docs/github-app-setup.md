# GitHub App setup

Use these steps to create a GitHub App for a self-hosted MergeProof deployment.

## 1. Create the app

In GitHub, go to:

```text
Settings -> Developer settings -> GitHub Apps -> New GitHub App
```

Suggested values:

- GitHub App name: `MergeProof Dev` or your deployment name
- Homepage URL: `http://localhost:3000` for local development, or your production URL
- Webhook: active
- Webhook URL:
  - local with Smee: `https://smee.io/mergeproof-dev`
  - production: `https://your-domain.example/api/github/webhook`
- Webhook secret: a strong random value that also goes in `GITHUB_WEBHOOK_SECRET`

## 2. Repository permissions

Configure the minimum permissions MergeProof currently needs:

- Metadata: read
- Contents: read-only
- Pull requests: read-only
- Checks: read and write

`Issues` permission is optional for later PR comment work. Current MergeProof behavior does not post comments yet.

## 3. Webhook events

Enable:

- Pull request
- Installation and repository-related events if available

Optional for later:

- Issue comment

MergeProof does not currently process issue comments.

## 4. Install on repositories

Install the app on selected repositories only while testing. Make sure the repository you use for PR tests is included in the installation.

If webhook processing works but PR checks do not appear, confirm the app is installed on the exact repository that owns the PR.

## 5. Generate a private key

In the GitHub App settings, find `Private keys` and generate a new private key. GitHub downloads a `.pem` file once.

Use the full PEM contents in `.env`:

```env
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

The value shown in GitHub settings like this is only a fingerprint:

```text
SHA256:...
```

That fingerprint is not the private key and cannot be used to create installation tokens.

## 6. Configure `.env`

```env
DATABASE_URL="postgresql://mergeproof:mergeproof@localhost:5432/mergeproof"
GITHUB_APP_ID="your-app-id"
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET="same-secret-configured-in-github"
APP_URL="http://localhost:3000"
```

Restart `npm run dev` after changing `.env`.

If Next.js starts on `3001` because `3000` is busy, update `APP_URL` and your local webhook target to `http://localhost:3001`.

## 7. Verify delivery

Run Smee locally:

```bash
npx smee-client --url https://smee.io/mergeproof-dev --target http://localhost:3000/api/github/webhook
```

Open or edit a PR in an installed repository. Smee should show a `POST` to `/api/github/webhook`, and the dashboard should show recent webhook events.
