import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!url || !publicUrl || !url.startsWith(publicUrl)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const response = await fetch(url);
  if (!response.ok) {
    return new NextResponse("Image not found", { status: 404 });
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
