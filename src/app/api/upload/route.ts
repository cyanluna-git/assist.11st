import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

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
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  // Check for R2 credentials
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    // Fallback: return a placeholder URL for dev without R2
    return NextResponse.json({
      url: `/api/placeholder-image?name=${encodeURIComponent(file.name)}`,
      warning: "R2 not configured, using placeholder",
    });
  }

  try {
    const ext = file.name.split(".").pop() || "jpg";
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Use R2 S3-compatible API
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const url = `${endpoint}/${bucketName}/${key}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
      },
      body: buffer,
    });

    if (!response.ok) {
      throw new Error(`R2 upload failed: ${response.status}`);
    }

    const publicFileUrl = publicUrl ? `${publicUrl}/${key}` : url;

    return NextResponse.json({ url: publicFileUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
