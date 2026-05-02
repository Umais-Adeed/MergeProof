import { db } from "@/lib/db";
import { getGitHubInstallationClient } from "@/lib/github/client";
import type { evaluatePullRequestEvidence } from "@/lib/evidence/evaluate-pr-body";

export const MERGEPROOF_CHECK_RUN_NAME = "mergeproof/evidence-gate";

type CreateOrUpdateMergeProofCheckRunInput = {
  installationId: number;
  owner: string;
  repo: string;
  headSha: string;
  pullRequestId: string;
  evaluation: ReturnType<typeof evaluatePullRequestEvidence>;
};

function getCheckRunPayload(evaluation: ReturnType<typeof evaluatePullRequestEvidence>) {
  return {
    status: "completed" as const,
    conclusion: evaluation.conclusion,
    output: {
      title: "MergeProof Evidence Gate",
      summary: evaluation.summary,
      text: evaluation.outputText,
    },
  };
}

export async function createOrUpdateMergeProofCheckRun({
  installationId,
  owner,
  repo,
  headSha,
  pullRequestId,
  evaluation,
}: CreateOrUpdateMergeProofCheckRunInput) {
  const octokit = getGitHubInstallationClient(installationId);
  const detailsUrl = process.env.APP_URL ? `${process.env.APP_URL}/` : null;
  const existingCheckRun = await db.checkRun.findUnique({
    where: {
      pullRequestId_name_headSha: {
        pullRequestId,
        name: MERGEPROOF_CHECK_RUN_NAME,
        headSha,
      },
    },
  });
  const payload = getCheckRunPayload(evaluation);

  if (existingCheckRun?.githubCheckRunId) {
    const response = await octokit.request("PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}", {
      owner,
      repo,
      check_run_id: Number(existingCheckRun.githubCheckRunId),
      details_url: detailsUrl ?? undefined,
      ...payload,
    });

    await db.checkRun.update({
      where: {
        id: existingCheckRun.id,
      },
      data: {
        status: response.data.status,
        conclusion: response.data.conclusion ?? null,
        detailsUrl: response.data.details_url ?? detailsUrl,
      },
    });

    return;
  }

  const response = await octokit.request("POST /repos/{owner}/{repo}/check-runs", {
    owner,
    repo,
    name: MERGEPROOF_CHECK_RUN_NAME,
    head_sha: headSha,
    details_url: detailsUrl ?? undefined,
    ...payload,
  });

  await db.checkRun.upsert({
    where: {
      pullRequestId_name_headSha: {
        pullRequestId,
        name: MERGEPROOF_CHECK_RUN_NAME,
        headSha,
      },
    },
    create: {
      githubCheckRunId: BigInt(response.data.id),
      pullRequestId,
      headSha,
      name: response.data.name,
      status: response.data.status,
      conclusion: response.data.conclusion ?? null,
      detailsUrl: response.data.details_url ?? detailsUrl,
    },
    update: {
      githubCheckRunId: BigInt(response.data.id),
      status: response.data.status,
      conclusion: response.data.conclusion ?? null,
      detailsUrl: response.data.details_url ?? detailsUrl,
    },
  });
}
