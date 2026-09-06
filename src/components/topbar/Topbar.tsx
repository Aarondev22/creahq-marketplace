import { BurgerMenu } from "./BurgerMenu";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { NotificationsBell } from "./NotificationsBell";
import { ProfileMenu } from "./ProfileMenu";

export function Topbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-surface/80 shadow-[0_8px_30px_-24px_color-mix(in_oklab,var(--brand-ink)_35%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-2.5">
        <BurgerMenu />
        <Logo />
        <div className="hidden min-w-0 flex-1 md:block">
          <SearchBar />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <NotificationsBell />
          <ProfileMenu />
        </div>
      </div>
      <div className="border-t border-border/50 bg-surface/65 px-3 py-2 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}