import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyGitHubWebhookSignature({
  payload,
  signature,
  secret,
}: {
  payload: string;
  signature: string;
  secret: string;
}) {
  const expectedPrefix = "sha256=";

  if (!signature.startsWith(expectedPrefix)) {
    return false;
  }

  const expectedDigest = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const expectedSignature = `${expectedPrefix}${expectedDigest}`;
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
