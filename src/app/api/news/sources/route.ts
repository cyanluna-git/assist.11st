import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { newsSources, userNewsSubscriptions } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = await db
    .select({ id: newsSources.id, name: newsSources.name, category: newsSources.category })
    .from(newsSources)
    .where(eq(newsSources.isActive, true))
    .orderBy(newsSources.name);

  const subscriptions = await db
    .select({ sourceId: userNewsSubscriptions.sourceId })
    .from(userNewsSubscriptions)
    .where(eq(userNewsSubscriptions.userId, session.sub));

  const subscribedIds = new Set(subscriptions.map((s) => s.sourceId));

  return NextResponse.json({
    sources: sources.map((s) => ({
      ...s,
      isSubscribed: subscribedIds.has(s.id),
    })),
  });
}
