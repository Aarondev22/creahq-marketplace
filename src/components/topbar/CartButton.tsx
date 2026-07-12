import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

export function CartButton() {
  const { totalCount } = useCart();
  return (
    <Link
      to="/warenkorb"
      aria-label="Warenkorb"
      className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-brand-ink transition-colors hover:bg-brand-soft"
    >
      <ShoppingCart className="h-5 w-5" />
      {totalCount > 0 && (
        <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-brand text-[9px] font-bold text-primary-foreground">
          {totalCount}
        </span>
      )}
    </Link>
  );
}
