import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLunchRecommendationForUser, serializeLunchError } from "@/lib/lunch";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recommendation = await getLunchRecommendationForUser(session.sub);
    return NextResponse.json({ recommendation });
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
