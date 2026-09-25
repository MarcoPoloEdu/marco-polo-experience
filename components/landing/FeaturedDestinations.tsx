import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { destinations } from "@/lib/data/schools";

export function FeaturedDestinations() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Featured destinations
          </h2>
          <p className="mt-2 text-muted-foreground">
            Start with visa-free language hubs popular with US travelers.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {destinations.map((dest) => (
            <Link
              key={dest.slug}
              href={`/search?passport=USA&language=${dest.languages[0]}`}
              className="group overflow-hidden rounded-xl border border-border transition hover:border-primary/40"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={dest.imageUrl}
                  alt={`${dest.city}, ${dest.country}`}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <div className="space-y-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground">
                    {dest.city}
                  </h3>
                  <ArrowRight className="size-4 text-primary opacity-0 transition group-hover:opacity-100" />
                </div>
                <p className="text-sm text-muted-foreground">{dest.country}</p>
                <p className="text-sm text-foreground/80">{dest.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
