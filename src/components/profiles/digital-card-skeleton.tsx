import { Skeleton } from "@/components/ui/skeleton";

export function DigitalCardSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "384/208" }}>
      <Skeleton className="h-full w-full" />
    </div>
  );
}
