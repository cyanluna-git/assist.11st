"use client";

import { useState } from "react";
import { useProfiles } from "@/hooks/use-profiles";
import { useDebounce } from "@/hooks/use-debounce";
import { ProfileCard } from "@/components/profiles/profile-card";
import { ProfileSearchBar } from "@/components/profiles/profile-search-bar";
import { ProfileCardSkeleton } from "@/components/profiles/profile-card-skeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ProfilesPageClient() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data: profiles, isLoading, isError } = useProfiles(debouncedSearch || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-strong">프로필 디렉토리</h1>
          <p className="mt-1 text-sm text-text-muted">ASSIST 11기 원우 프로필</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="w-full sm:w-72">
            <ProfileSearchBar value={search} onChange={setSearch} />
          </div>
          <a href="/api/members/vcf" download="assist11th-contacts.vcf">
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
              <Download className="size-3.5" />
              주소록
            </Button>
          </a>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProfileCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-error/20 bg-error/5 p-4 text-center text-sm text-error">
          프로필을 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {profiles && profiles.length === 0 && (
        <div className="rounded-lg bg-muted p-8 text-center text-sm text-text-muted">
          {debouncedSearch
            ? `"${debouncedSearch}"에 대한 검색 결과가 없습니다.`
            : "등록된 프로필이 없습니다."}
        </div>
      )}

      {profiles && profiles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
