"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CourseGalleryProps {
  images: string[];
  schoolName: string;
}

export function CourseGallery({ images, schoolName }: CourseGalleryProps) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted">
        <Image
          src={current}
          alt={`${schoolName} campus photo ${active + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(index)}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-lg border",
              active === index ? "border-primary ring-2 ring-primary/20" : "border-border"
            )}
          >
            <Image
              src={src}
              alt={`${schoolName} thumbnail ${index + 1}`}
              fill
              className="object-cover"
              sizes="120px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
