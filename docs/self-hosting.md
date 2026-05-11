# Self-hosting MergeProof

This guide runs MergeProof locally for development or on your own infrastructure for self-hosted use.

## 1. Clone the repository

```bash
git clone https://github.com/Umais-Adeed/MergeProof.git
cd MergeProof
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create `.env` from the example:

```bash
cp .env.example .env
```

Required values:

```env
DATABASE_URL="postgresql://mergeproof:mergeproof@localhost:5432/mergeproof"
GITHUB_APP_ID=""
GITHUB_PRIVATE_KEY=""
GITHUB_WEBHOOK_SECRET=""
APP_URL="http://localhost:3000"
```

`GITHUB_PRIVATE_KEY` must be the full PEM private key downloaded from your GitHub App settings. The SHA256 fingerprint shown on GitHub is not usable for authentication.

## 4. Start Postgres

```bash
docker compose up -d
```

This starts a local Postgres database with:

- database: `mergeproof`
- user: `mergeproof`
- password: `mergeproof`
- port: `5432`

## 5. Run migrations

```bash
npx prisma migrate dev
```

## 6. Generate Prisma client

```bash
npx prisma generate
```

## 7. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

If `3000` is already in use, Next.js may switch to `3001`. If that happens, update `APP_URL` in `.env` and the Smee target to the same port.

## 8. Expose webhooks in development with Smee

GitHub cannot deliver webhooks directly to `localhost`. Use Smee in development:

```bash
npx smee-client --url https://smee.io/mergeproof-dev --target http://localhost:3000/api/github/webhook
```

Set your GitHub App webhook URL to the Smee URL, such as:

```text
https://smee.io/mergeproof-dev
```

## Production requirement

In production, MergeProof needs a public HTTPS URL that GitHub can reach. Configure your GitHub App webhook URL to:

```text
https://your-domain.example/api/github/webhook
```

Do not use `localhost` as the GitHub webhook URL. It only works from your own machine and GitHub cannot reach it.

## Self-hosted GitHub App ownership

Each self-hosted deployment should create and own its own GitHub App. MergeProof does not ship with shared hosted credentials. Your deployment should use your own:

- GitHub App ID
- private key PEM
- webhook secret
- repository permissions
- selected repository installation
