"use client";

import { useState, type FormEvent } from "react";
import { MessageSquare } from "lucide-react";
import { useGroupPosts, useCreateGroupPost } from "@/hooks/use-groups";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

interface GroupPostsTabProps {
  groupId: string;
  isMember: boolean;
}

export function GroupPostsTab({ groupId, isMember }: GroupPostsTabProps) {
  const { data: posts, isLoading } = useGroupPosts(groupId);
  const createPost = useCreateGroupPost(groupId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createPost.mutate(
      { title: title.trim(), content: content.trim() },
      {
        onSuccess: () => {
          setTitle("");
          setContent("");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Write form — only for members */}
      {isMember ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-card p-4 space-y-3"
        >
          <h3 className="text-sm font-semibold text-text-strong">게시글 작성</h3>
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="w-full rounded-lg border border-line-subtle bg-canvas px-3 py-2 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <textarea
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            maxLength={10000}
            className="w-full resize-none rounded-lg border border-line-subtle bg-canvas px-3 py-2 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createPost.isPending || !title.trim() || !content.trim()}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
            >
              {createPost.isPending ? "등록 중..." : "게시글 등록"}
            </button>
          </div>
          {createPost.isError && (
            <p className="text-xs text-red-500">
              {createPost.error?.message ?? "오류가 발생했습니다"}
            </p>
          )}
        </form>
      ) : (
        <div className="rounded-xl border border-dashed p-4 text-center text-sm text-text-muted">
          멤버만 게시글을 작성할 수 있습니다
        </div>
      )}

      {/* Post list */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="size-5 animate-spin rounded-full border-2 border-muted border-t-brand" />
        </div>
      )}

      {!isLoading && (!posts || posts.length === 0) && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-text-muted">
          <MessageSquare className="size-8 opacity-30" />
          <p className="text-sm">아직 게시글이 없습니다</p>
        </div>
      )}

      {!isLoading && posts && posts.length > 0 && (
        <div className="divide-y divide-line-subtle rounded-xl border bg-card">
          {posts.map((post) => (
            <div key={post.id} className="flex gap-3 p-4">
              {/* Author avatar */}
              <div className="shrink-0">
                {post.authorAvatar ? (
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName ?? ""}
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-text-muted">
                    {(post.authorName ?? "?")[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-text-strong">
                    {post.authorName ?? "알 수 없음"}
                  </span>
                  <span className="shrink-0 text-[11px] text-text-muted">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
                <h4 className="mt-1 text-sm font-semibold text-text-strong">
                  {post.title}
                </h4>
                <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-text-muted">
                  {post.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
