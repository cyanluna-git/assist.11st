"use client";

import { Building2, Github, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImageColor } from "@/hooks/use-image-color";
import type { Profile } from "@/types/profile";

const FALLBACK_COLORS = [
  ["#0f4d81", "#0d4472"],
  ["#0A66C2", "#004182"],
  ["#ad7b2f", "#b8860b"],
  ["#2d3436", "#636e72"],
  ["#6c5ce7", "#a29bfe"],
  ["#1c8b57", "#00695c"],
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
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name[0] ?? "?").toUpperCase();
}

export function DirectoryCard({
  profile,
  onClick,
}: {
  profile: Profile;
  onClick: () => void;
}) {
  const imageColors = useImageColor(profile.avatarUrl);
  const fallback = FALLBACK_COLORS[hashName(profile.name) % FALLBACK_COLORS.length];
  const primary = imageColors?.primary ?? fallback[0];
  const dark = imageColors?.dark ?? fallback[1];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card text-left ring-1 ring-foreground/10 transition-all duration-300 hover:ring-brand/30 hover:shadow-xl hover:shadow-brand/5"
    >
      {/* Top gradient banner */}
      <div
        className="relative h-20 w-full"
        style={{ background: `linear-gradient(135deg, ${primary}, ${dark})` }}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {profile.github && (
            <div className="rounded-full bg-white/20 p-1">
              <Github className="size-3 text-white" />
            </div>
          )}
          {profile.linkedin && (
            <div className="rounded-full bg-white/20 p-1">
              <Linkedin className="size-3 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Photo */}
      <div className="relative mx-auto -mt-10 flex w-full flex-col items-center px-5">
        <div className="relative overflow-hidden rounded-lg ring-3 ring-card shadow-lg" style={{ width: 72, height: 90 }}>
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="size-full object-cover"
            />
          ) : (
            <div
              className="flex size-full items-center justify-center text-2xl font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${primary}, ${dark})` }}
            >
              {getInitials(profile.name)}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center gap-2 px-5 pb-5 pt-3 text-center">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-text-strong">
            {profile.name}
          </h3>
          {(profile.company || profile.position) && (
            <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-text-muted">
              <Building2 className="size-3 shrink-0" />
              <span className="truncate">
                {[profile.company, profile.position]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </p>
          )}
        </div>

        {profile.bio && (
          <p className="line-clamp-2 text-xs leading-relaxed text-text-subtle">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        className="h-0.5 w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(to right, ${primary}, ${dark})` }}
      />
    </button>
  );
}
