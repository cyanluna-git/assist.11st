"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "./avatar-upload";
import { useUpdateProfile, useUploadAvatar } from "@/hooks/use-profiles";
import type { CareerEntry, ProfileDetail, ProfileUpdatePayload } from "@/types/profile";

export function ProfileEditForm({
  profile,
  onCancel,
  onSaved,
}: {
  profile: ProfileDetail;
  onCancel: () => void;
  onSaved: (message?: string) => void;
}) {
  const [form, setForm] = useState<ProfileUpdatePayload>({
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    company: profile.company ?? "",
    position: profile.position ?? "",
    industry: profile.industry ?? "",
    interests: profile.interests ?? "",
    bio: profile.bio ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    github: profile.github ?? "",
    portfolio: profile.portfolio ?? "",
    linkedin: profile.linkedin ?? "",
    careers: (profile.careers as CareerEntry[]) ?? [],
  });
  const [inlineMessage, setInlineMessage] = useState<{
    tone: "info" | "success" | "error";
    text: string;
  } | null>(null);

  const updateProfile = useUpdateProfile(profile.id);
  const uploadAvatar = useUploadAvatar();

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAvatarUpload(file: File) {
    setInlineMessage({ tone: "info", text: "사진을 업로드하는 중입니다..." });

    try {
      const url = await uploadAvatar.mutateAsync(file);
      setForm((prev) => ({ ...prev, avatarUrl: url }));
      setInlineMessage({
        tone: "success",
        text: "사진을 올렸어요. 저장을 누르면 프로필에 반영됩니다.",
      });
    } catch {
      setInlineMessage({
        tone: "error",
        text: "사진 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.",
      });
    }
  }

  function addCareer() {
    setForm((prev) => ({
      ...prev,
      careers: [
        ...(prev.careers ?? []),
        { company: "", position: "", startDate: "", endDate: "", current: false },
      ],
    }));
  }

  function removeCareer(index: number) {
    setForm((prev) => ({
      ...prev,
      careers: (prev.careers ?? []).filter((_, i) => i !== index),
    }));
  }

  function updateCareer(index: number, field: keyof CareerEntry, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      careers: (prev.careers ?? []).map((career, i) =>
        i === index ? { ...career, [field]: value } : career,
      ),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInlineMessage({ tone: "info", text: "프로필을 저장하는 중입니다..." });

    try {
      await updateProfile.mutateAsync(form);
      onSaved("프로필이 저장되었습니다.");
    } catch {
      setInlineMessage({
        tone: "error",
        text: "저장 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    }
  }

  const isSaving = updateProfile.isPending;
  const feedback =
    inlineMessage ??
    (uploadAvatar.isPending
      ? { tone: "info" as const, text: "사진을 업로드하는 중입니다..." }
      : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AvatarUpload
        src={form.avatarUrl || null}
        name={form.name || profile.name}
        isUploading={uploadAvatar.isPending}
        onUpload={handleAvatarUpload}
      />

      {feedback && (
        <p
          className={cn(
            "rounded-xl border px-3 py-2 text-sm",
            feedback.tone === "error" && "border-error/20 bg-error/5 text-error",
            feedback.tone === "success" && "border-success/20 bg-success/5 text-success",
            feedback.tone === "info" && "border-brand/20 bg-brand/5 text-brand-dark",
          )}
        >
          {feedback.text}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">이름 (본명) *</Label>
        <Input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="본명을 입력하세요"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">전화번호</Label>
          <Input
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="010-0000-0000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company">회사</Label>
          <Input
            id="company"
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="소속 회사"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="position">직위</Label>
          <Input
            id="position"
            name="position"
            value={form.position}
            onChange={handleChange}
            placeholder="직위/직책"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="industry">업종</Label>
          <Input
            id="industry"
            name="industry"
            value={form.industry}
            onChange={handleChange}
            placeholder="업종"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="interests">관심분야</Label>
          <Input
            id="interests"
            name="interests"
            value={form.interests}
            onChange={handleChange}
            placeholder="AI, 마케팅, 재무 등"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="bio">자기소개</Label>
          <Textarea
            id="bio"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="간단한 자기소개를 입력하세요"
            rows={4}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="github">GitHub</Label>
          <Input
            id="github"
            name="github"
            value={form.github}
            onChange={handleChange}
            placeholder="https://github.com/username"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            name="linkedin"
            value={form.linkedin}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/username"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="portfolio">포트폴리오</Label>
          <Input
            id="portfolio"
            name="portfolio"
            value={form.portfolio}
            onChange={handleChange}
            placeholder="https://yoursite.com"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Label>경력</Label>
              <p className="text-xs text-text-subtle">
                최근 경력부터 자유롭게 정리하세요. 접지 않고 바로 편집할 수 있습니다.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCareer}
              className="w-full sm:w-auto"
            >
              <Plus data-icon="inline-start" className="size-3.5" />
              경력 추가
            </Button>
          </div>
        </div>
        {(form.careers ?? []).map((career, idx) => (
          <div key={idx} className="space-y-3 rounded-lg border border-foreground/10 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>회사</Label>
                <Input
                  value={career.company}
                  onChange={(e) => updateCareer(idx, "company", e.target.value)}
                  placeholder="회사명"
                />
              </div>
              <div className="space-y-1.5">
                <Label>직위</Label>
                <Input
                  value={career.position}
                  onChange={(e) => updateCareer(idx, "position", e.target.value)}
                  placeholder="직위/직책"
                />
              </div>
              <div className="space-y-1.5">
                <Label>시작일</Label>
                <Input
                  type="month"
                  value={career.startDate}
                  onChange={(e) => updateCareer(idx, "startDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>종료일</Label>
                <Input
                  type="month"
                  value={career.current ? "" : career.endDate ?? ""}
                  onChange={(e) => updateCareer(idx, "endDate", e.target.value)}
                  disabled={career.current}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-foreground/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-text-main">
                <input
                  type="checkbox"
                  checked={career.current}
                  onChange={(e) => updateCareer(idx, "current", e.target.checked)}
                  className="rounded"
                />
                현재 재직 중
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCareer(idx)}
                className="w-full justify-center text-text-muted hover:text-error sm:w-auto"
              >
                <Trash2 data-icon="inline-start" className="size-4" />
                경력 삭제
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-line-subtle pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          취소
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving && <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />}
          저장
        </Button>
      </div>
    </form>
  );
}
