import {
  classifyChangedFiles,
  type ChangedFileSignals,
  type PullRequestChangedFile,
} from "@/lib/evidence/classify-changed-files";

type EvidenceConclusion = "success" | "neutral" | "failure";

type EvidenceSectionKey =
  | "What changed"
  | "Why"
  | "Proof"
  | "Risk"
  | "AI assistance";

type EvidenceEvaluation = {
  score: number;
  maxScore: number;
  conclusion: EvidenceConclusion;
  summary: string;
  detectedSections: string[];
  missingSections: string[];
  weakSections: string[];
  changedFileSignals: ChangedFileSignals;
  outputText: string;
};

const SECTION_ALIASES: Array<{
  canonical: EvidenceSectionKey;
  aliases: string[];
}> = [
  {
    canonical: "What changed",
    aliases: ["what changed", "summary", "change summary"],
  },
  {
    canonical: "Why",
    aliases: ["why", "motivation", "reason"],
  },
  {
    canonical: "Proof",
    aliases: ["proof", "testing", "tests", "evidence"],
  },
  {
    canonical: "Risk",
    aliases: ["risk", "risks", "blast radius"],
  },
  {
    canonical: "AI assistance",
    aliases: ["ai assistance", "ai disclosure", "ai use"],
  },
];

const WEAK_VALUES = new Set(["n/a", "na", "none", "todo", "-", "not sure"]);

function normalizeHeading(line: string) {
  return line
    .trim()
    .replace(/^#{1,6}\s*/, "")
    .replace(/[:：]\s*$/, "")
    .trim()
    .toLowerCase();
}

function getCanonicalSectionName(line: string) {
  const normalized = normalizeHeading(line);

  for (const section of SECTION_ALIASES) {
    if (section.aliases.includes(normalized)) {
      return section.canonical;
    }
  }

  return null;
}

function extractSectionContent(body: string) {
  const lines = body.split(/\r?\n/);
  const sections = new Map<EvidenceSectionKey, string[]>();

  let currentSection: EvidenceSectionKey | null = null;

  for (const line of lines) {
    const matchedSection = getCanonicalSectionName(line);

    if (matchedSection) {
      currentSection = matchedSection;

      if (!sections.has(matchedSection)) {
        sections.set(matchedSection, []);
      }

      continue;
    }

    if (currentSection) {
      sections.get(currentSection)?.push(line);
    }
  }

  return new Map(
    Array.from(sections.entries()).map(([section, contentLines]) => [
      section,
      contentLines.join("\n").trim(),
    ]),
  );
}

function hasMeaningfulContent(content: string) {
  const trimmed = content.trim();
  const compact = trimmed.replace(/\s+/g, " ");

  if (compact.replace(/\s/g, "").length < 15) {
    return false;
  }

  if (WEAK_VALUES.has(compact.toLowerCase())) {
    return false;
  }

  return true;
}

function getConclusion(score: number): EvidenceConclusion {
  if (score >= 4) {
    return "success";
  }

  if (score >= 2) {
    return "neutral";
  }

  return "failure";
}

function getSummary(score: number, maxScore: number, conclusion: EvidenceConclusion) {
  if (conclusion === "success") {
    return `Evidence score: ${score}/${maxScore}. This PR includes enough review evidence.`;
  }

  if (conclusion === "neutral") {
    return `Evidence score: ${score}/${maxScore}. This PR includes partial review evidence.`;
  }

  return `Evidence score: ${score}/${maxScore}. This PR does not include enough review evidence.`;
}

export function evaluatePullRequestEvidence({
  title,
  body,
  changedFiles = [],
}: {
  title: string;
  body: string | null;
  changedFiles?: PullRequestChangedFile[];
}): EvidenceEvaluation {
  const normalizedBody = body ?? "";
  const sections = extractSectionContent(normalizedBody);
  const changedFileSignals = classifyChangedFiles(changedFiles);

  const detectedSections: string[] = [];
  const missingSections: string[] = [];
  const weakSections: string[] = [];

  for (const section of SECTION_ALIASES) {
    const content = sections.get(section.canonical);

    if (!content) {
      missingSections.push(section.canonical);
      continue;
    }

    if (hasMeaningfulContent(content)) {
      detectedSections.push(section.canonical);
      continue;
    }

    weakSections.push(section.canonical);
  }

  const score = detectedSections.length;
  const maxScore = SECTION_ALIASES.length;
  const conclusion = getConclusion(score);
  const summary = getSummary(score, maxScore, conclusion);
  const titleLine = title.trim() ? `PR title: ${title.trim()}` : "PR title: (missing)";
  const detectedLine =
    detectedSections.length > 0 ? detectedSections.join(", ") : "None";
  const missingLine = missingSections.length > 0 ? missingSections.join(", ") : "None";
  const weakLine = weakSections.length > 0 ? weakSections.join(", ") : "None";
  const changedFileLines = [
    "Changed-file signals:",
    `- Docs only: ${changedFileSignals.docsOnly ? "yes" : "no"}`,
    `- Source files changed: ${changedFileSignals.sourceFilesChanged ? "yes" : "no"}`,
    `- Test files changed: ${changedFileSignals.testFilesChanged ? "yes" : "no"}`,
    `- Config/dependency files changed: ${changedFileSignals.configOrDependencyFilesChanged ? "yes" : "no"}`,
    `- Migration/database files changed: ${changedFileSignals.migrationOrDatabaseFilesChanged ? "yes" : "no"}`,
    `- Large PR warning: ${changedFileSignals.largePrWarning ? "yes" : "no"}`,
    `- Source changed without tests: ${changedFileSignals.sourceChangedWithoutTests ? "yes" : "no"}`,
    `- Changed file count: ${changedFileSignals.changedFileCount}`,
    `- Total additions/deletions: ${changedFileSignals.totalLineChanges}`,
  ];

  const outputText = [
    titleLine,
    "",
    `Detected sections: ${detectedLine}`,
    `Missing sections: ${missingLine}`,
    `Weak sections: ${weakLine}`,
    "",
    "Scoring rules:",
    "- 4 or 5 valid sections: success",
    "- 2 or 3 valid sections: neutral",
    "- 0 or 1 valid sections: failure",
    "",
    "A section only counts when it has at least 15 non-whitespace characters.",
    'Placeholders such as "N/A", "none", "todo", "-", or "not sure" do not count.',
    "",
    ...changedFileLines,
    "",
    "This verdict is deterministic and does not use AI yet.",
  ].join("\n");

  return {
    score,
    maxScore,
    conclusion,
    summary,
    detectedSections,
    missingSections,
    weakSections,
    changedFileSignals,
    outputText,
  };
}
