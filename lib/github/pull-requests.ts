import { db } from "@/lib/db";
import { evaluatePullRequestEvidence } from "@/lib/evidence/evaluate-pr-body";
import { createOrUpdateMergeProofCheckRun } from "@/lib/github/check-runs";

type JsonObject = Record<string, unknown>;

type SupportedWebhookEvent = {
  eventName: string;
  action: string | null;
  payload: unknown;
};

type PullRequestPayload = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  headSha: string;
  baseRef: string | null;
  authorLogin: string;
  repositoryOwner: string;
  repositoryName: string;
  installationId: number | null;
};

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPullRequestPayload(payload: unknown): PullRequestPayload | null {
  if (!isObject(payload) || !isObject(payload.pull_request) || !isObject(payload.repository)) {
    return null;
  }

  const pullRequest = payload.pull_request;
  const repository = payload.repository;

  if (
    typeof pullRequest.id !== "number" ||
    typeof pullRequest.number !== "number" ||
    typeof pullRequest.title !== "string" ||
    typeof pullRequest.state !== "string" ||
    !isObject(pullRequest.head) ||
    typeof pullRequest.head.sha !== "string" ||
    !isObject(pullRequest.base) ||
    typeof pullRequest.base.ref !== "string" ||
    !isObject(pullRequest.user) ||
    typeof pullRequest.user.login !== "string" ||
    typeof repository.name !== "string"
  ) {
    return null;
  }

  const ownerLogin =
    isObject(repository.owner) && typeof repository.owner.login === "string"
      ? repository.owner.login
      : typeof repository.full_name === "string"
        ? repository.full_name.split("/")[0]
        : null;

  if (!ownerLogin) {
    return null;
  }

  return {
    id: pullRequest.id,
    number: pullRequest.number,
    title: pullRequest.title,
    body: typeof pullRequest.body === "string" ? pullRequest.body : null,
    state: pullRequest.state,
    headSha: pullRequest.head.sha,
    baseRef: pullRequest.base.ref,
    authorLogin: pullRequest.user.login,
    repositoryOwner: ownerLogin,
    repositoryName: repository.name,
    installationId:
      isObject(payload.installation) && typeof payload.installation.id === "number"
        ? payload.installation.id
        : null,
  };
}

const handledPullRequestActions = new Set([
  "opened",
  "edited",
  "reopened",
  "synchronize",
  "ready_for_review",
  "closed",
]);

const checkRunActions = new Set([
  "opened",
  "edited",
  "synchronize",
  "reopened",
  "ready_for_review",
]);

export async function processPullRequestWebhookEvent({
  eventName,
  action,
  payload,
}: SupportedWebhookEvent) {
  if (eventName !== "pull_request" || !action || !handledPullRequestActions.has(action)) {
    return { handled: false };
  }

  const pullRequest = getPullRequestPayload(payload);

  if (!pullRequest) {
    throw new Error("Pull request payload is missing required repository or PR fields.");
  }

  const repository = await db.repository.findUnique({
    where: {
      owner_name: {
        owner: pullRequest.repositoryOwner,
        name: pullRequest.repositoryName,
      },
    },
    select: {
      id: true,
    },
  });

  if (!repository) {
    throw new Error(
      `Repository ${pullRequest.repositoryOwner}/${pullRequest.repositoryName} is not synced yet.`,
    );
  }

  const savedPullRequest = await db.pullRequest.upsert({
    where: {
      repositoryId_number: {
        repositoryId: repository.id,
        number: pullRequest.number,
      },
    },
    create: {
      githubPrId: BigInt(pullRequest.id),
      repositoryId: repository.id,
      number: pullRequest.number,
      title: pullRequest.title,
      body: pullRequest.body,
      state: pullRequest.state,
      headSha: pullRequest.headSha,
      baseRef: pullRequest.baseRef,
      authorLogin: pullRequest.authorLogin,
    },
    update: {
      githubPrId: BigInt(pullRequest.id),
      title: pullRequest.title,
      body: pullRequest.body,
      state: pullRequest.state,
      headSha: pullRequest.headSha,
      baseRef: pullRequest.baseRef,
      authorLogin: pullRequest.authorLogin,
    },
  });

  if (checkRunActions.has(action)) {
    if (!pullRequest.installationId) {
      throw new Error("Pull request payload is missing installation.id for check run creation.");
    }

    const evaluation = evaluatePullRequestEvidence({
      title: pullRequest.title,
      body: pullRequest.body,
    });

    await createOrUpdateMergeProofCheckRun({
      installationId: pullRequest.installationId,
      owner: pullRequest.repositoryOwner,
      repo: pullRequest.repositoryName,
      headSha: pullRequest.headSha,
      pullRequestId: savedPullRequest.id,
      evaluation,
    });
  }

  return { handled: true };
}
