"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThesisForm } from "@/components/thesis/thesis-form";
import { useThesis, useUpdateThesis } from "@/hooks/use-theses";
import { useCurrentUser } from "@/hooks/use-current-user";

export function EditThesisClient() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: thesis, isLoading } = useThesis(id);
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const updateThesis = useUpdateThesis(id);

  // Auth guard: redirect non-authors
  useEffect(() => {
    if (!isLoading && !userLoading && thesis && currentUser) {
      if (thesis.authorId !== currentUser.id) {
        router.replace(`/thesis/${id}`);
      }
    }
  }, [isLoading, userLoading, thesis, currentUser, router, id]);

  if (isLoading || userLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!thesis) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/thesis")}
        >
          <ArrowLeft data-icon="inline-start" className="size-3.5" />
          목록으로
        </Button>
        <div className="rounded-lg border border-error/20 bg-error/5 p-4 text-center text-sm text-error">
          논문을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  // Don't render form if not author (while redirect is pending)
  if (currentUser && thesis.authorId !== currentUser.id) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/thesis/${id}`)}
      >
        <ArrowLeft data-icon="inline-start" className="size-3.5" />
        돌아가기
      </Button>

      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <h1 className="mb-6 text-lg font-semibold text-text-strong">
          논문 수정
        </h1>
        <ThesisForm
          initialTitle={thesis.title}
          initialAbstract={thesis.abstract ?? ""}
          initialField={thesis.field ?? ""}
          onSubmit={(values) => {
            updateThesis.mutate(values, {
              onSuccess: () => router.push(`/thesis/${id}`),
            });
          }}
          isPending={updateThesis.isPending}
          submitLabel="수정하기"
        />
        {updateThesis.isError && (
          <p className="mt-3 text-sm text-error">
            {updateThesis.error.message}
          </p>
        )}
      </div>
    </div>
  );
}
