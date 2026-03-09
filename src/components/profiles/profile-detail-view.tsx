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
          <div className="flex flex-col gap-2">
            {profile.github && (
              <a
                href={profile.github.startsWith("http") ? profile.github : `https://github.com/${profile.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-[#24292e]/15 bg-[#24292e] px-4 py-3 text-white transition-opacity hover:opacity-90"
              >
                <Github className="size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">GitHub</p>
                  <p className="truncate text-xs text-white/70">
                    {profile.github.replace(/^https?:\/\/(www\.)?github\.com\/?/, "")}
                  </p>
                </div>
                <ExternalLink className="size-3.5 shrink-0 text-white/50" />
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-[#0A66C2]/15 bg-[#0A66C2] px-4 py-3 text-white transition-opacity hover:opacity-90"
              >
                <Linkedin className="size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">LinkedIn</p>
                  <p className="truncate text-xs text-white/70">
                    {profile.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, "")}
                  </p>
                </div>
                <ExternalLink className="size-3.5 shrink-0 text-white/50" />
              </a>
            )}
            {profile.portfolio && (
              <a
                href={profile.portfolio.startsWith("http") ? profile.portfolio : `https://${profile.portfolio}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-foreground/10 bg-muted px-4 py-3 transition-colors hover:bg-muted/80"
              >
                <Globe className="size-5 shrink-0 text-text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-strong">포트폴리오</p>
                  <p className="truncate text-xs text-text-muted">
                    {profile.portfolio.replace(/^https?:\/\/(www\.)?/, "")}
                  </p>
                </div>
                <ExternalLink className="size-3.5 shrink-0 text-text-subtle" />
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
