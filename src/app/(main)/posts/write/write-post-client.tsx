"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostForm } from "@/components/posts/post-form";
import { useCreatePost } from "@/hooks/use-posts";

export function WritePostClient() {
  const router = useRouter();
  const createPost = useCreatePost();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/posts")}>
        <ArrowLeft data-icon="inline-start" className="size-3.5" />
        목록으로
      </Button>

      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <h1 className="mb-6 text-lg font-semibold text-text-strong">새 글 작성</h1>
        <PostForm
          onSubmit={(values) => {
            createPost.mutate(values, {
              onSuccess: () => router.push("/posts"),
            });
          }}
          isPending={createPost.isPending}
          submitLabel="작성하기"
        />
        {createPost.isError && (
          <p className="mt-3 text-sm text-error">
            {createPost.error.message}
          </p>
        )}
      </div>
    </div>
  );
}
