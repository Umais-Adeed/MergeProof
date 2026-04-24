import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { verifyGitHubWebhookSignature } from "@/lib/github/webhook";

export async function POST(request: Request) {
  const eventName = request.headers.get("x-github-event");
  const deliveryId = request.headers.get("x-github-delivery");
  const signature = request.headers.get("x-hub-signature-256");
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!signature || !webhookSecret || !eventName || !deliveryId) {
    return NextResponse.json(
      { error: "Missing required GitHub webhook headers or secret." },
      { status: 401 },
    );
  }

  const rawBody = await request.text();

  const isValidSignature = verifyGitHubWebhookSignature({
    payload: rawBody,
    signature,
    secret: webhookSecret,
  });

  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: Prisma.InputJsonValue;

  try {
    payload = JSON.parse(rawBody) as Prisma.InputJsonValue;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const action =
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "action" in payload &&
    typeof payload.action === "string"
      ? payload.action
      : null;

  try {
    await db.webhookEvent.create({
      data: {
        deliveryId,
        eventName,
        action,
        rawPayload: payload,
        processed: false,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      console.info("GitHub webhook delivery already stored", {
        deliveryId,
        eventName,
      });

      return NextResponse.json({
        ok: true,
        duplicate: true,
      });
    }

    console.error("Failed to store GitHub webhook", {
      deliveryId,
      eventName,
      error,
    });

    return NextResponse.json({ error: "Failed to store webhook event." }, { status: 500 });
  }

  console.info("GitHub webhook stored", {
    deliveryId,
    eventName,
    action,
  });

  return NextResponse.json({
    ok: true,
    deliveryId,
    eventName,
  });
}
