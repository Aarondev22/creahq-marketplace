import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/** Lucky star that lives somewhere on the current view and changes spot after each click. */
export function LuckyStar({ scope = "page" }: { scope?: "page" | "results" }) {
  const [seed, setSeed] = useState(0);
  const [pos, setPos] = useState<{ top: string; left: string }>({ top: "40%", left: "60%" });

  useEffect(() => {
    // Random spot inside a safe band (avoid extreme edges so it stays visible)
    const top = 10 + Math.random() * 70; // 10–80%
    const left = 6 + Math.random() * 84; // 6–90%
    setPos({ top: `${top}%`, left: `${left}%` });
  }, [seed]);

  function click() {
    try {
      const cur = Number(localStorage.getItem("creahq:star-found") ?? 0);
      localStorage.setItem("creahq:star-found", String(cur + 1));
    } catch { /* noop */ }
    toast("✨ Glücksstern gefangen! Er taucht woanders wieder auf.");
    setSeed((n) => n + 1);
  }

  return (
    <motion.button
      key={seed}
      onClick={click}
      aria-label="Glücksstern — klicken zum Sammeln"
      title={scope === "results" ? "Glücksstern in den Ergebnissen!" : "Glücksstern!"}
      className="pointer-events-auto absolute z-30 grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-amber-300 text-xl text-amber-900 shadow-lg ring-2 ring-amber-200/70 transition-transform hover:scale-110 sm:h-14 sm:w-14"
      style={{ top: pos.top, left: pos.left }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: [0, 360] }}
      transition={{ scale: { duration: 0.4 }, rotate: { duration: 22, repeat: Infinity, ease: "linear" } }}
      whileTap={{ scale: 1.3 }}
    >
      ★
    </motion.button>
  );
}
