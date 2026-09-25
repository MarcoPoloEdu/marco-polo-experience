import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { getLanguageLabel } from "@/lib/data/schools";
import { formatUsd } from "@/lib/pricing";
import type { DurationWeeks, School } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SchoolCardProps {
  school: School;
  weeks: DurationWeeks;
}

export function SchoolCard({ school, weeks }: SchoolCardProps) {
  const courseEstimate = school.weeklyPrice * weeks;
  const href = `/courses/${school.slug}`;

  return (
    <Card className="relative overflow-hidden border-border py-0 shadow-none transition hover:border-primary/40">
      <Link
        href={href}
        className="absolute inset-0 z-10"
        aria-label={`View course at ${school.name}`}
      />
      <div className="relative aspect-[16/10] bg-muted">
        <Image
          src={school.images[0]}
          alt={school.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <CardContent className="relative z-0 space-y-3 px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {school.name}
            </h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {school.city}, {school.country}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 capitalize">
            {getLanguageLabel(school.language)}
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-sm">
          <Star className="size-4 fill-amber-400 text-amber-400" />
          <span className="font-medium text-foreground">{school.rating}</span>
          <span className="text-muted-foreground">
            ({school.reviewCount} reviews)
          </span>
        </div>

        <div>
          <p className="text-lg font-semibold text-foreground">
            {formatUsd(school.weeklyPrice)}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / week
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            About {formatUsd(courseEstimate)} for {weeks} weeks (tuition only)
          </p>
        </div>
      </CardContent>
      <CardFooter className="relative z-0 px-4 pb-4">
        <span
          className={cn(
            buttonVariants({ size: "default" }),
            "pointer-events-none w-full"
          )}
        >
          View Course
        </span>
      </CardFooter>
    </Card>
  );
}
