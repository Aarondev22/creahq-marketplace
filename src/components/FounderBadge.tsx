import { Crown } from "lucide-react";

export function FounderBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Founder von CreaHQ"
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand to-fuchsia-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${className}`}
    >
      <Crown className="h-3 w-3" />
      Founder
    </span>
  );
}
