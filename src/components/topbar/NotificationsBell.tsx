import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell } from "lucide-react";

export function NotificationsBell() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Benachrichtigungen"
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-brand-ink transition-colors hover:bg-brand-soft"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-brand text-[9px] font-bold text-primary-foreground">
            0
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <div className="font-display text-lg font-bold text-brand-ink">Benachrichtigungen</div>
          <div className="text-xs text-muted-foreground">Hier landen Bestellungen, Downloads & News.</div>
        </div>
        <div className="px-4 py-10 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
            <Bell className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-brand-ink">Noch nichts los.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sobald jemand bei dir kauft oder du etwas bestellst, klingelt es hier.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
