import { db } from "@/lib/db";
import { groupMembers, groups } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Check if a user is a member of a group.
 * The leader (groups.leaderId) is also considered a member.
 */
export async function isGroupMember(
  groupId: string,
  userId: string,
): Promise<boolean> {
  // Check group_members table
  const membership = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    )
    .then((rows) => rows[0] ?? null);

  if (membership) return true;

  // Also check if the user is the leader
  const group = await db
    .select({ leaderId: groups.leaderId })
    .from(groups)
    .where(eq(groups.id, groupId))
    .then((rows) => rows[0] ?? null);

  return group?.leaderId === userId;
}

/**
 * Get the current member count for a group (includes leader).
 */
export async function getGroupMemberCount(groupId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId))
    .then((rows) => rows[0]);

  // groupMembers count — leader row may or may not be in group_members
  // We rely on join logic: leader is always inserted into group_members on creation
  return Number(result?.count ?? 0);
}
