import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getR2Client,
  getBucketName,
  generateKey,
  uploadToR2,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File too large (max 5MB)" },
      { status: 400 },
    );
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const client = getR2Client();
  const bucketName = getBucketName();

  if (!client || !bucketName) {
    return NextResponse.json({
      url: `/api/placeholder-image?name=${encodeURIComponent(file.name)}`,
      warning: "R2 not configured, using placeholder",
    });
  }

  try {
    const ext = file.name.split(".").pop() || "jpg";
    const key = generateKey("uploads", ext);
    const buffer = Buffer.from(await file.arrayBuffer());

    const fileUrl = await uploadToR2(key, buffer, file.type);

    return NextResponse.json({ url: fileUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
