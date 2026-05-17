# 🛡️ MergeProof — Deterministic PR Review Gate

<p align="center">
  <img src="logo.png" alt="MergeProof Logo" width="360" />
</p>

<p align="center">
  <strong>Repeatable evidence checks before your review even begins.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge" alt="Apache 2.0 License"></a>
  <a href="https://github.com/Umais-Adeed/MergeProof/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome"></a>
  <a href="https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js"><img src="https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js" alt="Built with Next.js"></a>
</p>

**MergeProof** is a _self-hosted GitHub App_ that automatically validates pull requests before maintainers spend precious review time on them.
It listens to GitHub webhooks, stores every webhook payload, syncs installations, repositories, and pull requests in PostgreSQL, and publishes a deterministic `mergeproof/evidence-gate` check run directly on GitHub pull requests.

If you want an objective, repeatable review gate that ensures contributors provide required details (context, risk, proof of testing, AI usage) before you read their code, this is it.

[Self-Hosting](docs/self-hosting.md) · [GitHub App Setup](docs/github-app-setup.md) · [PR Template](docs/pr-template.md) · [Architecture](docs/architecture.md) · [Troubleshooting](docs/troubleshooting.md)

---

## The Problem

> **Maintainers often receive pull requests without enough context to review safely.**
> The code might be fine, but the PR body fails to explain:
> - **What** changed and **why** it changed.
> - **How** it was tested and what **risks** exist.
> - Whether **AI assistance** was used.

MergeProof gives maintainers an early, repeatable signal before review starts. It does not judge code quality yet; instead, it enforces that a PR includes the minimum review evidence a maintainer needs.

## Highlights

- ⚡ **Webhook Intake** — GitHub App webhook intake with secure HMAC signature verification.
- 🗄️ **Robust Storage** — Raw webhook delivery logging and structured Prisma models in Postgres.
- 🔄 **Real-time Sync** — Automatic installations, repositories, and pull requests synchronization.
- 🎯 **Evidence Gates** — GitHub Check Run creation (`mergeproof/evidence-gate`) matching PR commits.
- 🔬 **Deterministic Scoring** — Evaluation of PR body sections and changed files against criteria.
- 🚫 **Duplicate Prevention** — Avoids repeated evaluation runs on unchanged commit SHAs.
- 📊 **Local Dashboard** — Instant metrics on webhooks, installations, repos, PRs, and check runs.

## How it works

1. **Webhook Delivery** — GitHub sends a webhook event to your self-hosted MergeProof instance.
2. **Signature Verification** — The Next.js API route verifies the HMAC signature of the payload.
3. **Ingestion & Sync** — MergeProof stores the raw payload and updates the installation/repository state.
4. **Deterministic Evaluation** — MergeProof analyzes the PR body and queries GitHub for the PR's changed files.
5. **Check Gate Update** — MergeProof publishes a `mergeproof/evidence-gate` check run on the target commit.

## Tech Stack

- **Runtime & Framework**: Next.js App Router (React, Node)
- **Language**: TypeScript
- **Database & ORM**: PostgreSQL, Prisma
- **Styling**: Tailwind CSS
- **Containerization**: Docker Compose
- **GitHub API Integration**: Octokit, Webhook Signature Verification

---

## Local Development

Runtime: **Node 22.16+ (Node 24 recommended)**.

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Fill in the configured GitHub App values in `.env`:
```env
DATABASE_URL="postgresql://mergeproof:mergeproof@localhost:5432/mergeproof"
GITHUB_APP_ID=""
GITHUB_PRIVATE_KEY=""
GITHUB_WEBHOOK_SECRET=""
APP_URL="http://localhost:3000"
```

### 3. Start Database
```bash
docker compose up -d
```

### 4. Run Migrations & Generate Client
```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

*(Note: If port `3000` is already in use, Next.js may start on `3001`. Update your `APP_URL` and Smee proxy target to match the active port.)*

---

## GitHub App Setup

Create your own GitHub App for self-hosted use. At minimum, configure:

- **Webhook URL**: Your public URL ending in `/api/github/webhook`
- **Webhook Secret**: Same value as `GITHUB_WEBHOOK_SECRET`
- **Repository Permissions**:
  - `Metadata`: read
  - `Contents`: read
  - `Pull requests`: read
  - `Checks`: read & write
- **Webhook Events**:
  - `Pull request`
  - `Installation` and `Repository` related events

> [!NOTE]
> Generate a private key in the GitHub Developer settings, and copy the full PEM block into `GITHUB_PRIVATE_KEY` in `.env`.

For a step-by-step walkthrough, see the [GitHub App Setup Guide](docs/github-app-setup.md).

## Testing locally with Smee

Since GitHub cannot send webhooks directly to `localhost`, use Smee.io as a webhook relay during development.

1. Create a channel on [Smee.io](https://smee.io/) (e.g., `https://smee.io/mergeproof-dev`).
2. Set your GitHub App webhook URL to that Smee channel.
3. Start the Smee client in a separate terminal:
   ```bash
   npx smee-client --url https://smee.io/mergeproof-dev --target http://localhost:3000/api/github/webhook
   ```
4. Open or edit a PR in a repository where the app is installed to trigger a webhook!

---

## Triggering a PR Check

Create or edit a pull request with a body that contains the following markdown headers:

```md
## What changed

## Why

## Proof

## Risk

## AI assistance
```

MergeProof evaluates the PR body, inspects changed files, and updates the `mergeproof/evidence-gate` Check Run.

For detailed scoring rules, check the [Recommended PR Template Reference](docs/pr-template.md).

---

## Limitations

- 🤖 No AI-based analysis (entirely deterministic check for presence of sections).
- 💬 No automated PR comments.
- ⚙️ No CI integration (e.g. GitHub Actions, CircleCI) checks yet.
- ☁️ No hosted SaaS mode (designed purely for self-hosting).
- 🔁 No manual retry handling (`check_run.rerequested` webhook events).

## Roadmap

- [ ] Update check runs from richer deterministic signals.
- [ ] Add maintainer-facing visual review summaries.
- [ ] Add optional automated PR feedback comments.
- [ ] Support flexible gate policy configurations.
- [ ] Integrate optional AI-based context and risk scoring once deterministic logic is completely stable.

---

## Docs by Goal

- 🚀 **Getting Started**: [Self-hosting guide](docs/self-hosting.md) · [GitHub App setup](docs/github-app-setup.md)
- 📋 **PR Rules**: [Recommended PR template](docs/pr-template.md)
- 🛠️ **Troubleshooting**: [Troubleshooting guide](docs/troubleshooting.md)
- 📐 **Architecture**: [Architecture overview](docs/architecture.md)

## License

MergeProof is open source and licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for more information.
