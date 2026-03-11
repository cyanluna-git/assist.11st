import { Skeleton } from "@/components/ui/skeleton";

export function DirectoryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Skeleton className="h-[190px] w-full rounded-none" />
      <div className="flex flex-col gap-2 px-4 pb-5 pt-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}
