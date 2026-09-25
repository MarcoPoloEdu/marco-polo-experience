import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MapPin, Star } from "lucide-react";
import { CheckoutBuilder } from "@/components/course/CheckoutBuilder";
import { CourseGallery } from "@/components/course/CourseGallery";
import { getLanguageLabel, getSchool, schools } from "@/lib/data/schools";
import { formatUsd } from "@/lib/pricing";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return schools.map((school) => ({ slug: school.slug }));
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const school = getSchool(slug);

  if (!school) {
    notFound();
  }

  return (
    <main className="flex-1 bg-white">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
            FastEdu
          </Link>
          <Link
            href={`/search?passport=USA&language=${school.language}`}
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            Back to results
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:py-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium capitalize text-primary">
              {getLanguageLabel(school.language)} course
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {school.name}
            </h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {school.city}, {school.country}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {school.rating} ({school.reviewCount} reviews)
              </span>
              <span>{formatUsd(school.weeklyPrice)} / week tuition</span>
            </p>
          </div>

          <CourseGallery images={school.images} schoolName={school.name} />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">About this course</h2>
            <p className="text-muted-foreground leading-relaxed">{school.description}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Amenities</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {school.amenities.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <CheckoutBuilder school={school} />
      </div>
    </main>
  );
}
