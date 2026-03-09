"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const sizeClass = size === "sm" ? "size-3.5" : "size-4";

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            readonly
              ? "cursor-default"
              : "cursor-pointer hover:text-yellow-400",
          )}
        >
          <Star
            className={cn(
              sizeClass,
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}
