"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostForm } from "@/components/posts/post-form";
import { usePost, useUpdatePost } from "@/hooks/use-posts";
import { useCurrentUser } from "@/hooks/use-current-user";

export function EditPostClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: post, isLoading, isError } = usePost(id);
  const { data: currentUser } = useCurrentUser();
  const updatePost = useUpdatePost(id);

  const canEdit =
    currentUser?.id === post?.authorId || currentUser?.role === "admin";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/posts")}>
          <ArrowLeft data-icon="inline-start" className="size-3.5" />
          목록으로
        </Button>
        <div className="rounded-lg border border-error/20 bg-error/5 p-8 text-center text-sm text-error">
          게시글을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/posts")}>
          <ArrowLeft data-icon="inline-start" className="size-3.5" />
          목록으로
        </Button>
        <div className="rounded-lg border border-error/20 bg-error/5 p-8 text-center text-sm text-error">
          수정 권한이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft data-icon="inline-start" className="size-3.5" />
        뒤로
      </Button>

      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <h1 className="mb-6 text-lg font-semibold text-text-strong">글 수정</h1>
        <PostForm
          defaultValues={{
            title: post.title,
            content: post.content,
            boardType: post.boardType,
          }}
          onSubmit={(values) => {
            updatePost.mutate(
              { title: values.title, content: values.content },
              {
                onSuccess: () => router.push(`/posts/${id}`),
              },
            );
          }}
          isPending={updatePost.isPending}
          submitLabel="수정하기"
          showBoardType={false}
        />
      </div>
    </div>
  );
}
