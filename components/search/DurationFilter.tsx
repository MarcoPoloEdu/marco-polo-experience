"use client";

import { DURATION_OPTIONS } from "@/lib/pricing";
import type { DurationWeeks } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DurationFilterProps {
  value: DurationWeeks;
  onChange: (weeks: DurationWeeks) => void;
}

export function DurationFilter({ value, onChange }: DurationFilterProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ink">Duración</p>
      <div className="flex flex-wrap gap-2">
        {DURATION_OPTIONS.map((opt) => {
          const selected = value === opt.weeks;
          return (
            <button
              key={opt.weeks}
              type="button"
              onClick={() => onChange(opt.weeks)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition",
                selected
                  ? "border-transparent bg-ink font-semibold text-white"
                  : "border-border bg-white text-ink hover:border-ink/30"
              )}
            >
              {opt.monthsLabel}
              <span className={cn("ml-1", selected ? "text-white/70" : "text-muted-foreground")}>
                ({opt.label})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
