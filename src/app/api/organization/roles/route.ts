import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizationRoles } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { ORGANIZATION_ROLE_ORDER } from "@/lib/organization";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
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

  const roles = (body as { roles?: unknown[] })?.roles;
  if (!Array.isArray(roles)) {
    return NextResponse.json({ error: "roles must be an array" }, { status: 400 });
  }

  const validRoleKeys = new Set(ORGANIZATION_ROLE_ORDER);
  const seenKeys = new Set<string>();
  const values = [];

  for (const item of roles) {
    if (!item || typeof item !== "object") {
      return NextResponse.json({ error: "Invalid role payload" }, { status: 400 });
    }

    const roleKey = (item as { roleKey?: string }).roleKey;
    const memberName = (item as { memberName?: string }).memberName;
    const photoUrl = (item as { photoUrl?: string | null }).photoUrl;

    if (!roleKey || !validRoleKeys.has(roleKey as (typeof ORGANIZATION_ROLE_ORDER)[number])) {
      return NextResponse.json({ error: "Invalid role key" }, { status: 400 });
    }
    if (seenKeys.has(roleKey)) {
      return NextResponse.json({ error: "Duplicate role key" }, { status: 400 });
    }
    seenKeys.add(roleKey);

    if (memberName !== undefined && typeof memberName !== "string") {
      return NextResponse.json({ error: "memberName must be a string" }, { status: 400 });
    }
    if (photoUrl !== undefined && photoUrl !== null && typeof photoUrl !== "string") {
      return NextResponse.json({ error: "photoUrl must be a string or null" }, { status: 400 });
    }

    values.push({
      roleKey: roleKey as (typeof ORGANIZATION_ROLE_ORDER)[number],
      memberName: memberName?.trim() || null,
      photoUrl: photoUrl?.trim() || null,
      updatedAt: new Date(),
    });
  }

  if (values.length !== ORGANIZATION_ROLE_ORDER.length) {
    return NextResponse.json(
      { error: "All organization roles must be provided" },
      { status: 400 },
    );
  }

  for (const value of values) {
    await db
      .insert(organizationRoles)
      .values(value)
      .onConflictDoUpdate({
        target: organizationRoles.roleKey,
        set: {
          memberName: value.memberName,
          photoUrl: value.photoUrl,
          updatedAt: value.updatedAt,
        },
      });
  }

  return NextResponse.json({ success: true });
}
