import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MapPin, Star } from "lucide-react";
import { CheckoutBuilder } from "@/components/course/CheckoutBuilder";
import { CourseGallery } from "@/components/course/CourseGallery";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
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
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.35fr_1fr] lg:items-start lg:py-12">
        <div className="space-y-7">
          <div className="space-y-3">
            <Link
              href={`/search?passport=COL&language=${school.language}`}
              className="text-sm font-medium text-indigo hover:underline"
            >
              ← Volver a resultados
            </Link>
            <p className="text-sm font-semibold tracking-[0.14em] text-mint uppercase">
              Curso de {getLanguageLabel(school.language)}
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {school.name}
            </h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {school.city}, {school.country}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {school.rating} ({school.reviewCount} reseñas)
              </span>
              <span>{formatUsd(school.weeklyPrice)} / semana de matrícula</span>
            </p>
          </div>

          <CourseGallery images={school.images} schoolName={school.name} />

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-ink">
              Sobre este curso
            </h2>
            <p className="leading-relaxed text-muted-foreground">{school.description}</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-ink">Amenidades</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {school.amenities.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-[#029a61]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <CheckoutBuilder school={school} />
      </div>

      <SiteFooter />
    </main>
  );
}
