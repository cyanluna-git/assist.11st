"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThesisCard } from "@/components/thesis/thesis-card";
import { useTheses } from "@/hooks/use-theses";
import { THESIS_FIELDS, THESIS_STATUSES } from "@/types/thesis";
import type { ThesisStatus } from "@/types/thesis";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export function ThesisPageClient() {
  const [field, setField] = useState<string | undefined>();
  const [status, setStatus] = useState<ThesisStatus | undefined>();
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data: theses, isLoading, isError } = useTheses(field, status, limit);

  const hasMore = (theses?.length ?? 0) >= limit;

  const handleFieldChange = (f: string | undefined) => {
    setField(f);
    setLimit(PAGE_SIZE);
  };

  const handleStatusChange = (s: ThesisStatus | undefined) => {
    setStatus(s);
    setLimit(PAGE_SIZE);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-strong">논문</h1>
          <p className="mt-1 text-sm text-text-muted">
            ASSIST 11기 논문 게시판
          </p>
        </div>
        <Link href="/thesis/write">
          <Button size="sm">
            <Plus data-icon="inline-start" className="size-3.5" />
            논문 등록
          </Button>
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto">
        <Button
          variant={status === undefined ? "default" : "outline"}
          size="xs"
          onClick={() => handleStatusChange(undefined)}
        >
          전체
        </Button>
        {THESIS_STATUSES.map((s) => (
          <Button
            key={s.value}
            variant={status === s.value ? "default" : "outline"}
            size="xs"
            onClick={() => handleStatusChange(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {/* Field filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant={field === undefined ? "default" : "muted"}
          className="cursor-pointer"
          onClick={() => handleFieldChange(undefined)}
        >
          전체 분야
        </Badge>
        {THESIS_FIELDS.map((f) => (
          <Badge
            key={f.value}
            variant={field === f.value ? "default" : "muted"}
            className={cn(
              "cursor-pointer",
              field === f.value ? "" : `${f.color} ${f.bg}`,
            )}
            onClick={() => handleFieldChange(f.value)}
          >
            {f.label}
          </Badge>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-error/20 bg-error/5 p-4 text-center text-sm text-error">
          논문을 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* Empty */}
      {theses && theses.length === 0 && (
        <div className="rounded-lg bg-muted p-8 text-center text-sm text-text-muted">
          아직 등록된 논문이 없습니다.
        </div>
      )}

      {/* Grid */}
      {theses && theses.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {theses.map((thesis) => (
              <ThesisCard key={thesis.id} thesis={thesis} />
            ))}
          </div>

          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
              >
                더보기
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
