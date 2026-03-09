import { Skeleton } from "@/components/ui/skeleton";

export function AlbumCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="p-3">
            <Skeleton className="h-4 w-3/4" />
            <div className="mt-2 flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
