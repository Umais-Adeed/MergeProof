import { db } from "@/lib/db";
import { getGitHubInstallationClient } from "@/lib/github/client";

const MERGEPROOF_CHECK_RUN_NAME = "mergeproof/evidence-gate";

type CreateMergeProofCheckRunInput = {
  installationId: number;
  owner: string;
  repo: string;
  headSha: string;
  pullRequestId: string;
};

export async function createMergeProofCheckRun({
  installationId,
  owner,
  repo,
  headSha,
  pullRequestId,
}: CreateMergeProofCheckRunInput) {
  const octokit = getGitHubInstallationClient(installationId);
  const detailsUrl = process.env.APP_URL ? `${process.env.APP_URL}/` : null;

  const response = await octokit.request("POST /repos/{owner}/{repo}/check-runs", {
    owner,
    repo,
    name: MERGEPROOF_CHECK_RUN_NAME,
    head_sha: headSha,
    status: "completed",
    conclusion: "neutral",
    details_url: detailsUrl ?? undefined,
    output: {
      title: "MergeProof evidence gate",
      summary:
        "MergeProof received this pull request and created the initial evidence-gate check run.",
    },
  });

  await db.checkRun.create({
    data: {
      githubCheckRunId: BigInt(response.data.id),
      pullRequestId,
      name: response.data.name,
      status: response.data.status,
      conclusion: response.data.conclusion ?? null,
      detailsUrl: response.data.details_url ?? detailsUrl,
    },
  });
}
