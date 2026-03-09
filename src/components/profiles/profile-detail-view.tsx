"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building2, Briefcase, Tag, Heart, Pencil, Github, Linkedin, Globe, ExternalLink } from "lucide-react";
import type { ProfileDetail, CareerEntry } from "@/types/profile";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-text-muted" />
      <div>
        <p className="text-xs text-text-subtle">{label}</p>
        <p className="text-sm text-text-main">{value}</p>
      </div>
    </div>
  );
}

export function ProfileDetailView({
  profile,
  isOwner,
  onEdit,
}: {
  profile: ProfileDetail;
  isOwner: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Avatar src={profile.avatarUrl} name={profile.name} size="lg" />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col items-center gap-2 sm:flex-row">
            <h1 className="text-xl font-semibold text-text-strong">
              {profile.name}
            </h1>
            <Badge variant="muted">{profile.role}</Badge>
          </div>
          {profile.position && profile.company && (
            <p className="mt-1 text-sm text-text-muted">
              {profile.company} &middot; {profile.position}
            </p>
          )}
        </div>
        {isOwner && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil data-icon="inline-start" className="size-3.5" />
            수정
          </Button>
        )}
      </div>

      {/* Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoRow icon={Mail} label="이메일" value={profile.email} />
        <InfoRow icon={Phone} label="전화번호" value={profile.phone} />
        <InfoRow icon={Building2} label="회사" value={profile.company} />
        <InfoRow icon={Briefcase} label="직위" value={profile.position} />
        <InfoRow icon={Tag} label="업종" value={profile.industry} />
        <InfoRow icon={Heart} label="관심분야" value={profile.interests} />
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-text-strong">자기소개</h2>
          <p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm text-text-main">
            {profile.bio}
          </p>
        </div>
      )}

      {/* Links */}
      {(profile.github || profile.portfolio || profile.linkedin) && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-text-strong">링크</h2>
          <div className="flex flex-wrap gap-3">
            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-text-main transition-colors hover:text-text-strong"
              >
                <Github className="size-4" />
                GitHub
                <ExternalLink className="size-3 text-text-subtle" />
              </a>
            )}
            {profile.portfolio && (
              <a
                href={profile.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-text-main transition-colors hover:text-text-strong"
              >
                <Globe className="size-4" />
                포트폴리오
                <ExternalLink className="size-3 text-text-subtle" />
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-text-main transition-colors hover:text-text-strong"
              >
                <Linkedin className="size-4" />
                LinkedIn
                <ExternalLink className="size-3 text-text-subtle" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Careers */}
      {profile.careers && profile.careers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-text-strong">경력</h2>
          <div className="space-y-3">
            {(profile.careers as CareerEntry[]).map((career, idx) => (
              <div
                key={idx}
                className="rounded-lg bg-muted p-4"
              >
                <p className="text-sm font-medium text-text-strong">
                  {career.company}
                </p>
                <p className="text-sm text-text-main">{career.position}</p>
                <p className="mt-1 text-xs text-text-subtle">
                  {career.startDate} ~ {career.current ? "현재" : career.endDate}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
