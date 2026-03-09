"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThesisForm } from "@/components/thesis/thesis-form";
import { useCreateThesis } from "@/hooks/use-theses";

export function WriteThesisClient() {
  const router = useRouter();
  const createThesis = useCreateThesis();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/thesis")}>
        <ArrowLeft data-icon="inline-start" className="size-3.5" />
        목록으로
      </Button>

      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <h1 className="mb-6 text-lg font-semibold text-text-strong">
          논문 등록
        </h1>
        <ThesisForm
          onSubmit={(values) => {
            createThesis.mutate(values, {
              onSuccess: (data) => router.push(`/thesis/${data.thesis.id}`),
            });
          }}
          isPending={createThesis.isPending}
          submitLabel="등록하기"
        />
        {createThesis.isError && (
          <p className="mt-3 text-sm text-error">
            {createThesis.error.message}
          </p>
        )}
      </div>
    </div>
  );
}
