"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCreateGroup } from "@/hooks/use-groups";
import { GROUP_CATEGORIES } from "@/types/group";

export function GroupNewClient() {
  const router = useRouter();
  const createGroup = useCreateGroup();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createGroup.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        maxMembers: maxMembers ? parseInt(maxMembers, 10) : undefined,
        imageUrl: imageUrl.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          router.push(`/groups/${data.group.id}`);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Back link */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-strong"
      >
        <ArrowLeft className="size-4" />
        소모임 목록
      </Link>

      <div className="rounded-2xl border bg-card p-6">
        <h1 className="mb-6 text-lg font-bold text-text-strong">소모임 만들기</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-strong">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="소모임 이름을 입력하세요"
              className="w-full rounded-lg border border-line-subtle bg-canvas px-3 py-2 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-strong">
              소개
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="소모임을 소개해 주세요"
              className="w-full resize-none rounded-lg border border-line-subtle bg-canvas px-3 py-2 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-strong">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-line-subtle bg-canvas px-3 py-2 text-sm text-text-strong focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">선택 안 함</option>
              {GROUP_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Max members */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-strong">
              최대 인원
            </label>
            <input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              min={2}
              max={100}
              placeholder="제한 없음"
              className="w-full rounded-lg border border-line-subtle bg-canvas px-3 py-2 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-strong">
              커버 이미지 URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-line-subtle bg-canvas px-3 py-2 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* Error */}
          {createGroup.isError && (
            <p className="text-sm text-red-500">
              {createGroup.error?.message ?? "오류가 발생했습니다"}
            </p>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/groups"
              className="rounded-lg border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-muted"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={createGroup.isPending || !name.trim()}
              className="rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
            >
              {createGroup.isPending ? "생성 중..." : "소모임 만들기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
