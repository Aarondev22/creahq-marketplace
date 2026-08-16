import React from "react";
import {
  ArrowLeft,
  Heart,
  Share2,
  Shield,
  Truck,
  Download,
  MessageCircle,
  Star,
  Package,
} from "lucide-react";
import { ReportButton } from "@/components/ReportButton";

export default function ListingPage() {
  const l = { id: "unknown" };
  const handleShare = () => {
    try {
      if (navigator.share) {
        void navigator.share({ title: "Listing", text: "Check out this listing", url: window.location.href });
      }
    } catch (e) {
      // ignore share errors
      // eslint-disable-next-line no-console
      console.warn("Share failed", e);
    }
  };

  return (
    <div>
      <header className="flex items-center gap-4">
        <button aria-label="Zurück" title="Zurück" className="p-2">
          <ArrowLeft />
        </button>
        <h1 className="text-xl font-semibold">Listing</h1>
      </header>

      <section className="mt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Teilen"
            title="Teilen"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink transition-colors hover:border-brand hover:text-brand"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <div className="ml-1 mt-1">
            <ReportButton targetType="listing" targetId={l.id} />
          </div>
        </div>
      </section>
    </div>
  );
}
