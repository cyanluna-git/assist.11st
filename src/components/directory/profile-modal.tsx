"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProfile } from "@/hooks/use-profiles";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Building2, Briefcase, Tag, Heart, Github, Linkedin, Globe, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CareerEntry } from "@/types/profile";

const COLORS = [
  "from-brand to-brand-dark",
  "from-[#0A66C2] to-[#004182]",
  "from-accent-gold to-[#b8860b]",
  "from-[#2d3436] to-[#636e72]",
  "from-[#6c5ce7] to-[#a29bfe]",
  "from-success to-[#00695c]",
] as const;

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

function ModalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-32 w-full animate-pulse rounded-t-xl bg-muted" />
      <div className="flex flex-col items-center gap-3 px-6">
        <Skeleton className="h-24 w-20 rounded-lg" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-3 px-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function ProfileModal({
  profileId,
  open,
  onOpenChange,
}: {
  profileId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: profile, isLoading } = useProfile(profileId ?? "");

  const gradient = profile
    ? COLORS[hashName(profile.name) % COLORS.length]
    : COLORS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden p-0 sm:max-w-md">
        <DialogTitle className="sr-only">
          {profile?.name ?? "프로필"}
        </DialogTitle>

        {isLoading || !profile ? (
          <ModalSkeleton />
        ) : (
          <div className="flex flex-col overflow-y-auto" style={{ maxHeight: "85vh" }}>
            {/* Hero banner */}
            <div className={cn("relative h-28 shrink-0 bg-gradient-to-br", gradient)}>
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: "radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 30%, white 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }} />
            </div>

            {/* Photo + name — overlapping banner */}
            <div className="relative -mt-14 flex flex-col items-center px-6">
              <div className="overflow-hidden rounded-xl ring-4 ring-card shadow-xl" style={{ width: 88, height: 110 }}>
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className={cn(
                    "flex size-full items-center justify-center bg-gradient-to-br text-3xl font-bold text-white",
                    gradient,
                  )}>
                    {getInitials(profile.name)}
                  </div>
                )}
              </div>

              <h2 className="mt-3 text-lg font-bold tracking-tight text-text-strong">
                {profile.name}
              </h2>
              {(profile.company || profile.position) && (
                <p className="mt-0.5 text-sm text-text-muted">
                  {[profile.company, profile.position].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mx-6 mt-4">
                <p className="whitespace-pre-wrap rounded-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed text-text-main">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Info grid */}
            <div className="mx-6 mt-4 grid grid-cols-2 gap-3">
              {profile.email && (
                <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
                  <Mail className="size-4 shrink-0 text-text-muted" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-text-subtle">이메일</p>
                    <p className="truncate text-xs font-medium text-text-main">{profile.email}</p>
                  </div>
                </div>
              )}
              {profile.company && (
                <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
                  <Building2 className="size-4 shrink-0 text-text-muted" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-text-subtle">회사</p>
                    <p className="truncate text-xs font-medium text-text-main">{profile.company}</p>
                  </div>
                </div>
              )}
              {profile.position && (
                <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
                  <Briefcase className="size-4 shrink-0 text-text-muted" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-text-subtle">직위</p>
                    <p className="truncate text-xs font-medium text-text-main">{profile.position}</p>
                  </div>
                </div>
              )}
              {profile.industry && (
                <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
                  <Tag className="size-4 shrink-0 text-text-muted" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-text-subtle">업종</p>
                    <p className="truncate text-xs font-medium text-text-main">{profile.industry}</p>
                  </div>
                </div>
              )}
              {profile.interests && (
                <div className="col-span-2 flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
                  <Heart className="size-4 shrink-0 text-text-muted" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-text-subtle">관심분야</p>
                    <p className="truncate text-xs font-medium text-text-main">{profile.interests}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Links */}
            {(profile.github || profile.linkedin || profile.portfolio) && (
              <div className="mx-6 mt-4 flex flex-col gap-2">
                {profile.github && (
                  <a
                    href={profile.github.startsWith("http") ? profile.github : `https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg bg-[#24292e] px-4 py-2.5 text-white transition-opacity hover:opacity-90"
                  >
                    <Github className="size-4 shrink-0" />
                    <span className="flex-1 truncate text-xs">
                      {profile.github.replace(/^https?:\/\/(www\.)?github\.com\/?/, "")}
                    </span>
                    <ExternalLink className="size-3 shrink-0 text-white/50" />
                  </a>
                )}
                {profile.linkedin && (
                  <a
                    href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg bg-[#0A66C2] px-4 py-2.5 text-white transition-opacity hover:opacity-90"
                  >
                    <Linkedin className="size-4 shrink-0" />
                    <span className="flex-1 truncate text-xs">
                      {profile.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, "")}
                    </span>
                    <ExternalLink className="size-3 shrink-0 text-white/50" />
                  </a>
                )}
                {profile.portfolio && (
                  <a
                    href={profile.portfolio.startsWith("http") ? profile.portfolio : `https://${profile.portfolio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-foreground/10 bg-muted px-4 py-2.5 transition-colors hover:bg-muted/80"
                  >
                    <Globe className="size-4 shrink-0 text-text-muted" />
                    <span className="flex-1 truncate text-xs text-text-main">
                      {profile.portfolio.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                    <ExternalLink className="size-3 shrink-0 text-text-subtle" />
                  </a>
                )}
              </div>
            )}

            {/* Careers */}
            {profile.careers && profile.careers.length > 0 && (
              <div className="mx-6 mt-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">경력</h3>
                <div className="space-y-2">
                  {(profile.careers as CareerEntry[]).map((career, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg border border-foreground/5 bg-muted/30 px-4 py-3 pl-7"
                    >
                      {/* Timeline dot */}
                      <div className={cn("absolute left-3 top-4 size-2 rounded-full bg-gradient-to-br", gradient)} />
                      <p className="text-xs font-semibold text-text-strong">{career.company}</p>
                      <p className="text-xs text-text-main">{career.position}</p>
                      <p className="mt-0.5 text-[10px] text-text-subtle">
                        {career.startDate} ~ {career.current ? "현재" : career.endDate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom spacing */}
            <div className="h-6 shrink-0" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
