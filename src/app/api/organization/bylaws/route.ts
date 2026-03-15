import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bylawVersions } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const version = (body as { version?: string }).version?.trim();
  const content = (body as { content?: string }).content?.trim();

  if (!version) {
    return NextResponse.json({ error: "version is required" }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  if (version.length > 80) {
    return NextResponse.json({ error: "version is too long" }, { status: 400 });
  }

  try {
    const inserted = await db
      .insert(bylawVersions)
      .values({
        version,
        content,
        createdBy: session.sub,
      })
      .returning({ id: bylawVersions.id });

    return NextResponse.json({ success: true, id: inserted[0]?.id ?? null }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to publish bylaw version. version must be unique." },
      { status: 409 },
    );
  }
}
