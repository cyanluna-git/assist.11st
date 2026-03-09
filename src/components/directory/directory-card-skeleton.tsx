import { Skeleton } from "@/components/ui/skeleton";

export function DirectoryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {/* Banner */}
      <Skeleton className="h-20 w-full rounded-none" />
      {/* Photo placeholder */}
      <div className="flex flex-col items-center px-5 -mt-10">
        <Skeleton className="rounded-lg ring-3 ring-card" style={{ width: 72, height: 90 }} />
      </div>
      {/* Content */}
      <div className="flex flex-col items-center gap-2 px-5 pb-5 pt-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}
