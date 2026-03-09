import { NextRequest, NextResponse } from "next/server";
import { ilike, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.get("search");

  let query = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      company: users.company,
      position: users.position,
      industry: users.industry,
      interests: users.interests,
      bio: users.bio,
      github: users.github,
      portfolio: users.portfolio,
      linkedin: users.linkedin,
      careers: users.careers,
      avatarUrl: users.avatarUrl,
      role: users.role,
    })
    .from(users)
    .$dynamic();

  if (search) {
    const pattern = `%${search}%`;
    query = query.where(
      or(
        ilike(users.name, pattern),
        ilike(users.company, pattern),
        ilike(users.industry, pattern),
      ),
    );
  }

  const profiles = await query.orderBy(users.name);

  return NextResponse.json({ profiles });
}
