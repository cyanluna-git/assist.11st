import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { searchLunchPlacesByKeyword, serializeLunchError } from "@/lib/lunch";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ places: [] });
  }

  try {
    const places = await searchLunchPlacesByKeyword(query);
    return NextResponse.json({ places });
  } catch (error) {
    const serialized = serializeLunchError(error);
    return NextResponse.json(
      {
        error: serialized.error,
        errorCode: serialized.errorCode,
        retryable: serialized.retryable,
      },
      { status: serialized.status },
    );
  }
}
