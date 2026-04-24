import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";

import { getGitHubAppCredentials } from "@/lib/github/auth";

export function getGitHubInstallationClient(installationId: number | bigint | string) {
  const { appId, privateKey } = getGitHubAppCredentials();

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId: Number(installationId),
    },
  });
}
