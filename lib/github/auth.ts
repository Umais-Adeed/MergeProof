type GitHubAppCredentials = {
  appId: string;
  privateKey: string;
};

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, "\n").trim();
}

export function getGitHubAppCredentials(): GitHubAppCredentials {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const rawPrivateKey = process.env.GITHUB_PRIVATE_KEY?.trim();

  if (!appId) {
    throw new Error("GITHUB_APP_ID is not configured.");
  }

  if (!rawPrivateKey) {
    throw new Error("GITHUB_PRIVATE_KEY is not configured.");
  }

  const privateKey = normalizePrivateKey(rawPrivateKey);

  if (!privateKey.includes("BEGIN") || !privateKey.includes("PRIVATE KEY")) {
    throw new Error(
      "GITHUB_PRIVATE_KEY must be the full PEM private key, not a fingerprint or placeholder.",
    );
  }

  return {
    appId,
    privateKey,
  };
}
