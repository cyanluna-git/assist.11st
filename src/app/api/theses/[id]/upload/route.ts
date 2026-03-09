import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { thesis } from "@/db/schema";
import { getSession } from "@/lib/auth";
import {
  getR2Client,
  getBucketName,
  generateKey,
  uploadToR2,
  deleteFromR2,
  extractKeyFromUrl,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = ["pdf", "docx"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db
    .select({ authorId: thesis.authorId, fileUrl: thesis.fileUrl })
    .from(thesis)
    .where(eq(thesis.id, id))
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.authorId !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 20MB)" },
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: "Invalid file type (PDF or DOCX only)" },
      { status: 400 },
    );
  }

  const client = getR2Client();
  const bucketName = getBucketName();

  if (!client || !bucketName) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 },
    );
  }

  try {
    // Delete old file if exists
    if (existing.fileUrl) {
      const oldKey = extractKeyFromUrl(existing.fileUrl);
      if (oldKey) {
        try {
          await deleteFromR2(oldKey);
        } catch {
          // Old file cleanup failure is non-blocking
        }
      }
    }

    const key = generateKey("thesis", ext || "pdf");
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await uploadToR2(key, buffer, file.type);

    await db
      .update(thesis)
      .set({ fileUrl, updatedAt: new Date() })
      .where(eq(thesis.id, id));

    return NextResponse.json({ fileUrl });
  } catch (err) {
    console.error("Thesis upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db
    .select({ authorId: thesis.authorId, fileUrl: thesis.fileUrl })
    .from(thesis)
    .where(eq(thesis.id, id))
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.authorId !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!existing.fileUrl) {
    return NextResponse.json({ error: "No file to delete" }, { status: 404 });
  }

  const key = extractKeyFromUrl(existing.fileUrl);
  if (key) {
    try {
      await deleteFromR2(key);
    } catch {
      // R2 cleanup failure is non-blocking
    }
  }

  await db
    .update(thesis)
    .set({ fileUrl: null, updatedAt: new Date() })
    .where(eq(thesis.id, id));

  return NextResponse.json({ success: true });
}
