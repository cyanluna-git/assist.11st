"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "./avatar-upload";
import { useUpdateProfile, useUploadAvatar } from "@/hooks/use-profiles";
import type { ProfileDetail, ProfileUpdatePayload, CareerEntry } from "@/types/profile";
import { Loader2, Plus, Trash2 } from "lucide-react";

export function ProfileEditForm({
  profile,
  onCancel,
  onSaved,
}: {
  profile: ProfileDetail;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProfileUpdatePayload>({
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

  const updateProfile = useUpdateProfile(profile.id);
  const uploadAvatar = useUploadAvatar();

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAvatarUpload(file: File) {
    const url = await uploadAvatar.mutateAsync(file);
    setForm((prev) => ({ ...prev, avatarUrl: url }));
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
      careers: (prev.careers ?? []).map((c, i) =>
        i === index ? { ...c, [field]: value } : c,
      ),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateProfile.mutateAsync(form);
    onSaved();
  }

  const isSaving = updateProfile.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AvatarUpload
        src={form.avatarUrl || null}
        name={profile.name}
        isUploading={uploadAvatar.isPending}
        onUpload={handleAvatarUpload}
      />

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

      {/* Links */}
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

      {/* Careers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>경력</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCareer}>
            <Plus data-icon="inline-start" className="size-3.5" />
            경력 추가
          </Button>
        </div>
        {(form.careers ?? []).map((career, idx) => (
          <div
            key={idx}
            className="space-y-3 rounded-lg border border-foreground/10 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCareer(idx)}
                className="mt-6 shrink-0 text-text-muted hover:text-error"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm text-text-main">
              <input
                type="checkbox"
                checked={career.current}
                onChange={(e) => updateCareer(idx, "current", e.target.checked)}
                className="rounded"
              />
              현재 재직 중
            </label>
          </div>
        ))}
      </div>

      {updateProfile.isError && (
        <p className="text-sm text-error">저장 중 오류가 발생했습니다. 다시 시도해주세요.</p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          취소
        </Button>
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving && <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />}
          저장
        </Button>
      </div>
    </form>
  );
}
