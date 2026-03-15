import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bylawVersions, organizationRoles, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import {
  ORGANIZATION_ROLE_LABELS,
  ORGANIZATION_ROLE_ORDER,
} from "@/lib/organization";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [roles, history] = await Promise.all([
    db
      .select({
        id: organizationRoles.id,
        roleKey: organizationRoles.roleKey,
        memberName: organizationRoles.memberName,
        photoUrl: organizationRoles.photoUrl,
        updatedAt: organizationRoles.updatedAt,
      })
      .from(organizationRoles),
    db
      .select({
        id: bylawVersions.id,
        version: bylawVersions.version,
        content: bylawVersions.content,
        createdAt: bylawVersions.createdAt,
        createdByName: users.name,
      })
      .from(bylawVersions)
      .leftJoin(users, eq(bylawVersions.createdBy, users.id))
      .orderBy(desc(bylawVersions.createdAt), desc(bylawVersions.version)),
  ]);

  const roleMap = new Map(roles.map((role) => [role.roleKey, role]));
  const normalizedRoles = ORGANIZATION_ROLE_ORDER.map((roleKey) => {
    const existing = roleMap.get(roleKey);
    return {
      id: existing?.id ?? null,
      roleKey,
      title: ORGANIZATION_ROLE_LABELS[roleKey],
      memberName: existing?.memberName ?? null,
      photoUrl: existing?.photoUrl ?? null,
      updatedAt: existing?.updatedAt?.toISOString() ?? null,
    };
  });

  const normalizedHistory = history.map((version) => ({
    ...version,
    createdAt: version.createdAt.toISOString(),
  }));

  return NextResponse.json({
    roles: normalizedRoles,
    currentBylaw: normalizedHistory[0] ?? null,
    bylawHistory: normalizedHistory,
  });
}
