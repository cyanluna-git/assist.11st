"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { useProfiles } from "@/hooks/use-profiles";
import { useDebounce } from "@/hooks/use-debounce";
import { DirectoryCard } from "@/components/directory/directory-card";
import { DirectoryCardSkeleton } from "@/components/directory/directory-card-skeleton";
import { ProfileModal } from "@/components/directory/profile-modal";
import { Input } from "@/components/ui/input";

export function DirectoryPageClient() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const {
    data: profiles,
    isLoading,
    isError,
  } = useProfiles(debouncedSearch || undefined, true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-strong">원우 카드</h1>
          <p className="mt-1 text-sm text-text-muted">
            ASSIST 11기 원우 프로필 갤러리
          </p>
        </div>
        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <Input
              type="text"
              placeholder="이름, 회사, 업종 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {/* Count badge */}
      {profiles && profiles.length > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-text-muted">
          <Users className="size-4" />
          <span>{profiles.length}명의 원우</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <DirectoryCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-error/20 bg-error/5 p-4 text-center text-sm text-error">
          프로필을 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* Empty */}
      {profiles && profiles.length === 0 && (
        <div className="rounded-lg bg-muted p-8 text-center text-sm text-text-muted">
          {debouncedSearch
            ? `"${debouncedSearch}"에 대한 검색 결과가 없습니다.`
            : "프로필이 완성된 원우가 없습니다."}
        </div>
      )}

      {/* Card grid */}
      {profiles && profiles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <DirectoryCard
              key={profile.id}
              profile={profile}
              onClick={() => setSelectedId(profile.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ProfileModal
        profileId={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
