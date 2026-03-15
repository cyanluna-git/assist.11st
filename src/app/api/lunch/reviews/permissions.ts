import { canManageLunchReview } from "@/lib/lunch-validation";

export function canEditLunchReview(reviewUserId: string, sessionUserId: string, sessionRole: string) {
  return canManageLunchReview({ reviewUserId, sessionUserId, sessionRole });
}
