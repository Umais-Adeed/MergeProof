import { db } from "@/lib/db";

type JsonObject = Record<string, unknown>;

type InstallationAccount = {
  login: string;
  type?: string | null;
};

type InstallationPayload = {
  id: number;
  account?: InstallationAccount | null;
};

type RepositoryPayload = {
  id: number;
  name: string;
  full_name: string;
  owner?: {
    login?: string;
  } | null;
};

type SupportedWebhookEvent = {
  eventName: string;
  action: string | null;
  payload: unknown;
};

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getInstallation(payload: unknown): InstallationPayload | null {
  if (!isObject(payload) || !isObject(payload.installation)) {
    return null;
  }

  const installation = payload.installation;

  if (typeof installation.id !== "number") {
    return null;
  }

  const account = isObject(installation.account) && typeof installation.account.login === "string"
    ? {
        login: installation.account.login,
        type:
          typeof installation.account.type === "string"
            ? installation.account.type
            : null,
      }
    : null;

  return {
    id: installation.id,
    account,
  };
}

function getRepositoriesFromField(
  payload: unknown,
  fieldName: "repositories" | "repositories_added" | "repositories_removed",
) {
  if (!isObject(payload) || !(fieldName in payload) || !Array.isArray(payload[fieldName])) {
    return [];
  }

  return payload[fieldName]
    .map((repository): RepositoryPayload | null => {
      if (!isObject(repository)) {
        return null;
      }

      if (
        typeof repository.id !== "number" ||
        typeof repository.name !== "string" ||
        typeof repository.full_name !== "string"
      ) {
        return null;
      }

      const ownerLogin =
        isObject(repository.owner) && typeof repository.owner.login === "string"
          ? repository.owner.login
          : repository.full_name.split("/")[0];

      return {
        id: repository.id,
        name: repository.name,
        full_name: repository.full_name,
        owner: {
          login: ownerLogin,
        },
      };
    })
    .filter((repository): repository is RepositoryPayload => repository !== null);
}

async function upsertInstallationFromPayload(payload: unknown) {
  const installation = getInstallation(payload);

  if (!installation) {
    throw new Error("Installation payload is missing a valid installation object.");
  }

  if (!installation.account?.login) {
    throw new Error("Installation payload is missing installation.account.login.");
  }

  return db.installation.upsert({
    where: {
      githubInstallationId: BigInt(installation.id),
    },
    create: {
      githubInstallationId: BigInt(installation.id),
      accountLogin: installation.account.login,
      accountType: installation.account.type ?? null,
    },
    update: {
      accountLogin: installation.account.login,
      accountType: installation.account.type ?? null,
    },
  });
}

async function syncRepositories(
  installationId: string,
  repositories: RepositoryPayload[],
) {
  for (const repository of repositories) {
    const ownerLogin = repository.owner?.login;

    if (!ownerLogin) {
      continue;
    }

    await db.repository.upsert({
      where: {
        githubRepoId: BigInt(repository.id),
      },
      create: {
        githubRepoId: BigInt(repository.id),
        owner: ownerLogin,
        name: repository.name,
        fullName: repository.full_name,
        installationId,
      },
      update: {
        owner: ownerLogin,
        name: repository.name,
        fullName: repository.full_name,
        installationId,
      },
    });
  }
}

async function removeRepositories(repositories: RepositoryPayload[]) {
  const githubRepoIds = repositories.map((repository) => BigInt(repository.id));

  if (githubRepoIds.length === 0) {
    return;
  }

  await db.repository.deleteMany({
    where: {
      githubRepoId: {
        in: githubRepoIds,
      },
    },
  });
}

async function handlePingEvent() {
  return;
}

async function handleInstallationCreated(payload: unknown) {
  const installation = await upsertInstallationFromPayload(payload);
  const repositories = getRepositoriesFromField(payload, "repositories");

  await syncRepositories(installation.id, repositories);
}

async function handleInstallationDeleted(payload: unknown) {
  const installation = getInstallation(payload);

  if (!installation) {
    throw new Error("Installation deleted payload is missing a valid installation object.");
  }

  await db.installation.deleteMany({
    where: {
      githubInstallationId: BigInt(installation.id),
    },
  });
}

async function handleInstallationRepositoriesAdded(payload: unknown) {
  const installation = await upsertInstallationFromPayload(payload);
  const repositories = getRepositoriesFromField(payload, "repositories_added");

  await syncRepositories(installation.id, repositories);
}

async function handleInstallationRepositoriesRemoved(payload: unknown) {
  const repositories = getRepositoriesFromField(payload, "repositories_removed");

  await removeRepositories(repositories);
}

export async function processInstallationWebhookEvent({
  eventName,
  action,
  payload,
}: SupportedWebhookEvent) {
  if (eventName === "ping") {
    await handlePingEvent();
    return { handled: true };
  }

  if (eventName === "installation" && action === "created") {
    await handleInstallationCreated(payload);
    return { handled: true };
  }

  if (eventName === "installation" && action === "deleted") {
    await handleInstallationDeleted(payload);
    return { handled: true };
  }

  if (eventName === "installation_repositories" && action === "added") {
    await handleInstallationRepositoriesAdded(payload);
    return { handled: true };
  }

  if (eventName === "installation_repositories" && action === "removed") {
    await handleInstallationRepositoriesRemoved(payload);
    return { handled: true };
  }

  return { handled: false };
}
