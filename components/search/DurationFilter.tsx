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
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Duration</p>
      <div className="flex flex-wrap gap-2">
        {DURATION_OPTIONS.map((opt) => {
          const selected = value === opt.weeks;
          return (
            <button
              key={opt.weeks}
              type="button"
              onClick={() => onChange(opt.weeks)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition",
                selected
                  ? "border-primary bg-primary/5 font-medium text-primary"
                  : "border-border bg-white text-foreground hover:border-primary/40"
              )}
            >
              {opt.monthsLabel}
              <span className="ml-1 text-muted-foreground">({opt.label})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
