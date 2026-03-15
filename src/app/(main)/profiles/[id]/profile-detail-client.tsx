"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profiles";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProfileDetailView } from "@/components/profiles/profile-detail-view";
import { ProfileEditForm } from "@/components/profiles/profile-edit-form";

export function ProfileDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const { data: profile, isLoading, isError } = useProfile(id);
  const { data: currentUser } = useCurrentUser();

  const isOwner = currentUser?.id === profile?.id;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Skeleton className="size-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/directory")}>
          <ArrowLeft data-icon="inline-start" className="size-3.5" />
          목록으로
        </Button>
        <div className="rounded-lg border border-error/20 bg-error/5 p-8 text-center text-sm text-error">
          프로필을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/directory")}>
        <ArrowLeft data-icon="inline-start" className="size-3.5" />
        목록으로
      </Button>

      {flashMessage && (
        <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
          {flashMessage}
        </div>
      )}

      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        {isEditing ? (
          <ProfileEditForm
            profile={profile}
            onCancel={() => setIsEditing(false)}
            onSaved={(message) => {
              setIsEditing(false);
              setFlashMessage(message ?? "프로필이 저장되었습니다.");
            }}
          />
        ) : (
          <ProfileDetailView
            profile={profile}
            isOwner={isOwner}
            onEdit={() => {
              setFlashMessage(null);
              setIsEditing(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
