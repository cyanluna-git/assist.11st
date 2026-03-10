"use client";

import Link from "next/link";
import { BookOpen, Star, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheses } from "@/hooks/use-theses";
import { FIELD_MAP } from "@/types/thesis";

export function ThesisWidget() {
  const { data: theses, isLoading } = useTheses(undefined, undefined, 5, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>논문</CardTitle>
        <CardAction>
          <Link
            href="/thesis"
            className="flex items-center gap-0.5 text-xs text-text-muted transition-colors hover:text-brand"
          >
            전체보기
            <ChevronRight className="size-3.5" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-7 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!theses || theses.length === 0) && (
          <div className="flex flex-col items-center gap-2 py-6 text-text-muted">
            <BookOpen className="size-8 opacity-40" />
            <p className="text-sm">등록된 논문이 없습니다</p>
          </div>
        )}

        {!isLoading && theses && theses.length > 0 && (
          <ul className="divide-y divide-line-subtle">
            {theses.map((thesis) => {
              const field = thesis.field ? FIELD_MAP[thesis.field] : null;
              return (
                <li key={thesis.id}>
                  <Link
                    href={`/thesis/${thesis.id}`}
                    className="flex items-start gap-3 py-3 transition-colors hover:bg-canvas/50 first:pt-0 last:pb-0"
                  >
                    <Avatar
                      src={thesis.author.image}
                      name={thesis.author.name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {field && (
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${field.bg} ${field.color}`}
                          >
                            {field.label}
                          </span>
                        )}
                        <span className="truncate text-sm font-medium text-text-strong">
                          {thesis.title}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                        <span>{thesis.author.name}</span>
                        {thesis.reviewCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star className="size-3 fill-current text-amber-400" />
                            {thesis.avgRating.toFixed(1)}
                            <span className="text-text-muted/60">
                              ({thesis.reviewCount})
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
