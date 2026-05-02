ALTER TABLE "CheckRun"
ADD COLUMN "headSha" TEXT;

UPDATE "CheckRun"
SET "headSha" = "PullRequest"."headSha"
FROM "PullRequest"
WHERE "CheckRun"."pullRequestId" = "PullRequest"."id";

ALTER TABLE "CheckRun"
ALTER COLUMN "headSha" SET NOT NULL;

CREATE UNIQUE INDEX "CheckRun_pullRequestId_name_headSha_key"
ON "CheckRun"("pullRequestId", "name", "headSha");
