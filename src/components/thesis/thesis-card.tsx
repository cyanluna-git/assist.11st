"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "@/components/thesis/star-rating";
import { FIELD_MAP, STATUS_MAP } from "@/types/thesis";
import type { ThesisSummary } from "@/types/thesis";
import { cn } from "@/lib/utils";

export function ThesisCard({ thesis }: { thesis: ThesisSummary }) {
  const field = thesis.field ? FIELD_MAP[thesis.field] : null;
  const status = STATUS_MAP[thesis.status];

  return (
    <Link href={`/thesis/${thesis.id}`}>
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50">
        {/* Top: badges */}
        <div className="mb-2 flex items-center gap-1.5">
          {field && (
            <Badge
              variant="muted"
              className={cn("text-[10px]", field.color, field.bg)}
            >
              {field.label}
            </Badge>
          )}
          {status && (
            <Badge
              variant="muted"
              className={cn("text-[10px]", status.color, status.bg)}
            >
              {status.label}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-medium text-text-strong">
          {thesis.title}
        </h3>

        {/* Abstract preview */}
        {thesis.abstract && (
          <p className="mt-1 line-clamp-2 text-xs text-text-muted">
            {thesis.abstract}
          </p>
        )}

        {/* Bottom: author, rating, review count */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Avatar
              src={thesis.author.image}
              name={thesis.author.name}
              size="sm"
              className="!size-5 !text-[10px]"
            />
            <span>{thesis.author.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(thesis.avgRating)} readonly size="sm" />
            <span className="flex items-center gap-0.5 text-xs text-text-muted">
              <MessageSquare className="size-3" />
              {thesis.reviewCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
