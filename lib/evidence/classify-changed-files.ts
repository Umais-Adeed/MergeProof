export type PullRequestChangedFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
};

export type ChangedFileSignals = {
  docsOnly: boolean;
  sourceFilesChanged: boolean;
  testFilesChanged: boolean;
  configOrDependencyFilesChanged: boolean;
  migrationOrDatabaseFilesChanged: boolean;
  largePrWarning: boolean;
  sourceChangedWithoutTests: boolean;
  changedFileCount: number;
  totalLineChanges: number;
};

const DOC_EXTENSIONS = new Set([".md", ".mdx"]);
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const SOURCE_PREFIXES = ["app/", "lib/", "components/", "pages/", "src/", "server/", "api/"];
const CONFIG_FILES = new Set([
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts",
  "gradle.properties",
  "gradlew",
  "gradlew.bat",
  "tsconfig.json",
  "docker-compose.yml",
  "docker-compose.yaml",
  "Dockerfile",
]);

function normalizePath(path: string) {
  return path.replace(/\\/g, "/");
}

function getBasename(path: string) {
  const segments = path.split("/");
  return segments[segments.length - 1] ?? path;
}

function hasExtension(path: string, extensions: Set<string>) {
  const match = /\.[^./]+$/.exec(path.toLowerCase());
  return match ? extensions.has(match[0]) : false;
}

function isDocumentationFile(path: string) {
  const normalized = normalizePath(path);
  const basename = getBasename(normalized);

  return (
    basename === "README.md" ||
    normalized.startsWith("docs/") ||
    hasExtension(normalized, DOC_EXTENSIONS)
  );
}

function isTestFile(path: string) {
  const normalized = normalizePath(path);

  return (
    /(^|\/)(__tests__|test|tests)\//.test(normalized) ||
    /\.(test|spec)\.[^/]+$/i.test(normalized)
  );
}

function isConfigOrDependencyFile(path: string) {
  const normalized = normalizePath(path);
  const basename = getBasename(normalized);

  return (
    normalized.startsWith("gradle/") ||
    CONFIG_FILES.has(basename) ||
    /^eslint(\.|$)/i.test(basename) ||
    /^prettier(\.|$)/i.test(basename) ||
    /^next\.config\./i.test(basename)
  );
}

function isMigrationOrDatabaseFile(path: string) {
  const normalized = normalizePath(path);

  return (
    normalized === "prisma/schema.prisma" ||
    normalized.startsWith("prisma/migrations/") ||
    normalized.startsWith("migrations/") ||
    normalized.startsWith("db/")
  );
}

function isSourceFile(path: string) {
  const normalized = normalizePath(path);

  if (
    isDocumentationFile(normalized) ||
    isTestFile(normalized) ||
    isConfigOrDependencyFile(normalized) ||
    isMigrationOrDatabaseFile(normalized)
  ) {
    return false;
  }

  return (
    SOURCE_PREFIXES.some((prefix) => normalized.startsWith(prefix)) ||
    hasExtension(normalized, SOURCE_EXTENSIONS)
  );
}

export function classifyChangedFiles(files: PullRequestChangedFile[]): ChangedFileSignals {
  let docsOnly = files.length > 0;
  let sourceFilesChanged = false;
  let testFilesChanged = false;
  let configOrDependencyFilesChanged = false;
  let migrationOrDatabaseFilesChanged = false;
  let totalLineChanges = 0;

  for (const file of files) {
    const normalized = normalizePath(file.filename);
    const isDoc = isDocumentationFile(normalized);
    const isTest = isTestFile(normalized);
    const isConfig = isConfigOrDependencyFile(normalized);
    const isMigration = isMigrationOrDatabaseFile(normalized);
    const isSource = isSourceFile(normalized);

    docsOnly = docsOnly && isDoc;
    sourceFilesChanged = sourceFilesChanged || isSource;
    testFilesChanged = testFilesChanged || isTest;
    configOrDependencyFilesChanged = configOrDependencyFilesChanged || isConfig;
    migrationOrDatabaseFilesChanged = migrationOrDatabaseFilesChanged || isMigration;
    totalLineChanges += file.additions + file.deletions;
  }

  return {
    docsOnly,
    sourceFilesChanged,
    testFilesChanged,
    configOrDependencyFilesChanged,
    migrationOrDatabaseFilesChanged,
    largePrWarning: files.length > 10 || totalLineChanges > 500,
    sourceChangedWithoutTests: sourceFilesChanged && !testFilesChanged,
    changedFileCount: files.length,
    totalLineChanges,
  };
}
