import { BurgerMenu } from "./BurgerMenu";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { NotificationsBell } from "./NotificationsBell";
import { ProfileMenu } from "./ProfileMenu";
import { CartButton } from "./CartButton";

export function Topbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        <BurgerMenu />
        <Logo />
        <div className="hidden min-w-0 flex-1 md:block">
          <SearchBar />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <CartButton />
          <NotificationsBell />
          <ProfileMenu />
        </div>
      </div>
      <div className="border-t border-border/60 bg-surface/70 px-3 py-2 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
