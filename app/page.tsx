import Link from "next/link";
import { FeaturedDestinations } from "@/components/landing/FeaturedDestinations";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { TrustBadges } from "@/components/landing/TrustBadges";

export default function HomePage() {
  return (
    <main className="flex-1">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
            FastEdu
          </Link>
          <Link
            href="/search?passport=USA&language=english"
            className="text-sm font-medium text-foreground hover:text-primary"
          >
            Browse courses
          </Link>
        </div>
      </header>
      <HeroSearch />
      <TrustBadges />
      <FeaturedDestinations />
      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-8 text-sm text-muted-foreground sm:px-6">
          <p className="font-medium text-foreground">FastEdu</p>
          <p>Language courses for US passport holders—clear prices, visa-free destinations.</p>
        </div>
      </footer>
    </main>
  );
}
