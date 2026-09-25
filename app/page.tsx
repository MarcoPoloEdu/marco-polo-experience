import { FeaturedDestinations } from "@/components/landing/FeaturedDestinations";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { TrustBadges } from "@/components/landing/TrustBadges";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";

export default function HomePage() {
  return (
    <main className="flex-1">
      <div className="relative">
        <SiteHeader tone="dark" />
        <HeroSearch />
      </div>
      <TrustBadges />
      <FeaturedDestinations />
      <SiteFooter />
    </main>
  );
}
