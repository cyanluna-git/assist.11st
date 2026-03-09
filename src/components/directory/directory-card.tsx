"use client";

import { Building2, Github, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/profile";

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
  const gradient = COLORS[hashName(profile.name) % COLORS.length];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card text-left ring-1 ring-foreground/10 transition-all duration-300 hover:ring-brand/30 hover:shadow-xl hover:shadow-brand/5"
    >
      {/* Top gradient banner — like ID badge header */}
      <div className={cn("relative h-20 w-full bg-gradient-to-br", gradient)}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        {/* Social icons on banner */}
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

      {/* Photo — rectangular, overlapping the banner like an ID badge */}
      <div className="relative mx-auto -mt-10 flex w-full flex-col items-center px-5">
        <div className="relative overflow-hidden rounded-lg ring-3 ring-card shadow-lg" style={{ width: 72, height: 90 }}>
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="size-full object-cover"
            />
          ) : (
            <div className={cn(
              "flex size-full items-center justify-center bg-gradient-to-br text-2xl font-semibold text-white",
              gradient,
            )}>
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
      <div className={cn("h-0.5 w-full bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100", gradient)} />
    </button>
  );
}
