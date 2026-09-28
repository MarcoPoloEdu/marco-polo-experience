import Link from "next/link";
import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  tone?: "dark" | "light";
}

export function SiteHeader({ tone = "light" }: SiteHeaderProps) {
  const dark = tone === "dark";

  return (
    <header
      className={cn(
        "absolute inset-x-0 top-0 z-30",
        !dark && "relative border-b border-border bg-white/90 backdrop-blur"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-full",
              dark ? "bg-mint text-ink" : "bg-ink text-mint"
            )}
          >
            <Compass className="size-4" strokeWidth={2.5} />
          </span>
          <span className="leading-tight">
            <span
              className={cn(
                "block font-heading text-base font-semibold tracking-tight sm:text-lg",
                dark ? "text-white" : "text-ink"
              )}
            >
              Marco Polo Experience
            </span>
            <span
              className={cn(
                "block text-[11px] font-medium tracking-wide uppercase",
                dark ? "text-white/70" : "text-muted-foreground"
              )}
            >
              Hermana de Marco Polo Education
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/search"
            className={cn(
              "hidden text-sm font-medium transition sm:inline",
              dark
                ? "text-white/80 hover:text-white"
                : "text-muted-foreground hover:text-ink"
            )}
          >
            Explorar cursos
          </Link>
          <a
            href="https://www.marcopoloeducation.com"
            target="_blank"
            rel="noreferrer"
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-semibold transition",
              dark
                ? "bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20"
                : "bg-ink text-white hover:bg-ink/90"
            )}
          >
            Asesoría MPE
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="max-w-md space-y-2">
          <p className="font-heading text-xl font-semibold">Marco Polo Experience</p>
          <p className="text-sm text-white/70">
            Cursos cortos de idiomas con precio transparente. Empresa hermana de{" "}
            <a
              href="https://www.marcopoloeducation.com"
              className="text-mint underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Marco Polo Education
            </a>
            . Porque no se trata solo de aprender un idioma: se trata de vivirlo.
          </p>
        </div>
        <p className="text-sm text-white/50">© {new Date().getFullYear()} Marco Polo Experience</p>
      </div>
    </footer>
  );
}
