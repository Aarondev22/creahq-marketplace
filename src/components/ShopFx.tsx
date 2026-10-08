import { useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform, useScroll, useReducedMotion } from "motion/react";
import type { ShopBadge, ShopTheme } from "@/lib/shopTheme";

/** Deterministischer Pseudozufall – identisch auf Server und Client (keine Hydration-Fehler). */
function rand(i: number, salt: number) {
  const x = Math.sin(i * 9301 + salt * 49297) * 233280;
  return x - Math.floor(x);
}

export function accentStyle(theme: ShopTheme): CSSProperties {
  return { ["--shop-accent" as string]: theme.accent } as CSSProperties;
}

/** Animierter Shop-Hintergrund hinter dem gesamten Shop. */
export function ShopScene({ theme, className = "" }: { theme: ShopTheme; className?: string }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const parallax = useTransform(scrollY, [0, 1200], [0, -180]);
  const a = theme.accent;

  if (theme.bg === "none") return null;

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
      {theme.bg === "image" && theme.bgImage && (
        <motion.div style={{ y: reduce ? 0 : parallax }} className="absolute inset-0 -bottom-48">
          <img src={theme.bgImage} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </motion.div>
      )}

      {theme.bg === "bubbles" &&
        Array.from({ length: 16 }).map((_, i) => {
          const size = 24 + rand(i, 1) * 90;
          return (
            <motion.span
              key={i}
              className="absolute rounded-full border"
              style={{
                left: `${rand(i, 2) * 100}%`,
                bottom: -120,
                width: size,
                height: size,
                borderColor: `color-mix(in oklab, ${a} 45%, transparent)`,
                background: `radial-gradient(circle at 30% 30%, color-mix(in oklab, ${a} 25%, transparent), transparent 70%)`,
              }}
              animate={reduce ? undefined : { y: [0, -1400], x: [0, (rand(i, 3) - 0.5) * 120, 0] }}
              transition={{ duration: 14 + rand(i, 4) * 14, repeat: Infinity, delay: rand(i, 5) * 10, ease: "linear" }}
            />
          );
        })}

      {theme.bg === "confetti" &&
        Array.from({ length: 22 }).map((_, i) => {
          const size = 10 + rand(i, 6) * 34;
          const hue = [a, "var(--paint-coral)", "var(--paint-sun)", "var(--paint-cyan)"][i % 4];
          return (
            <motion.span
              key={i}
              className="absolute"
              style={{
                left: `${rand(i, 7) * 100}%`,
                top: `${rand(i, 8) * 100}%`,
                width: size,
                height: size * (0.7 + rand(i, 9) * 0.6),
                background: hue,
                opacity: 0.35,
                borderRadius: `${40 + rand(i, 10) * 40}% ${30 + rand(i, 11) * 50}% ${50 + rand(i, 12) * 30}% ${35 + rand(i, 13) * 40}%`,
              }}
              animate={reduce ? undefined : { rotate: [0, 360], scale: [1, 1.25, 1], y: [0, -20, 0] }}
              transition={{ duration: 8 + rand(i, 14) * 10, repeat: Infinity, ease: "easeInOut" }}
            />
          );
        })}

      {theme.bg === "waves" && (
        <div className="absolute inset-x-0 bottom-0 h-[60%]">
          {[0, 1, 2].map((i) => (
            <motion.svg
              key={i}
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              className="absolute bottom-0 h-full w-[200%]"
              style={{ opacity: 0.12 + i * 0.07 }}
              animate={reduce ? undefined : { x: ["0%", "-50%"] }}
              transition={{ duration: 18 + i * 8, repeat: Infinity, ease: "linear" }}
            >
              <path
                fill={a}
                d="M0,160 C240,260 480,60 720,160 C960,260 1200,60 1440,160 L1440,320 L0,320 Z M1440,160 C1680,260 1920,60 2160,160 C2400,260 2640,60 2880,160 L2880,320 L1440,320 Z"
                transform={`translate(0 ${i * 40})`}
              />
            </motion.svg>
          ))}
        </div>
      )}

      {theme.bg === "stars" &&
        Array.from({ length: 60 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${rand(i, 15) * 100}%`,
              top: `${rand(i, 16) * 100}%`,
              width: 2 + rand(i, 17) * 4,
              height: 2 + rand(i, 17) * 4,
              background: a,
              boxShadow: `0 0 12px ${a}`,
            }}
            animate={reduce ? undefined : { opacity: [0.1, 1, 0.1], scale: [0.6, 1.3, 0.6] }}
            transition={{ duration: 2 + rand(i, 18) * 4, repeat: Infinity, delay: rand(i, 19) * 4 }}
          />
        ))}

      {theme.bg === "blobs" &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              width: 420,
              height: 420,
              left: `${[5, 55, 30][i]}%`,
              top: `${[5, 20, 55][i]}%`,
              background: [a, "var(--paint-coral)", "var(--paint-cyan)"][i],
              opacity: 0.22,
            }}
            animate={
              reduce
                ? undefined
                : {
                    x: [0, 120, -80, 0],
                    y: [0, -90, 60, 0],
                    scale: [1, 1.2, 0.9, 1],
                    borderRadius: ["50%", "40% 60% 55% 45%", "60% 40% 45% 55%", "50%"],
                  }
            }
            transition={{ duration: 16 + i * 4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
    </div>
  );
}

/** Endlos gleitendes Laufband. */
export function ShopMarquee({ text, accent }: { text: string; accent: string }) {
  const reduce = useReducedMotion();
  if (!text.trim()) return null;
  const items = Array.from({ length: 6 }, () => text);
  return (
    <div
      className="relative overflow-hidden rounded-full border py-2.5"
      style={{ borderColor: `color-mix(in oklab, ${accent} 40%, transparent)`, background: `color-mix(in oklab, ${accent} 12%, var(--card))` }}
    >
      <motion.div
        className="flex w-max gap-10 whitespace-nowrap text-sm font-bold text-brand-ink"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </motion.div>
    </div>
  );
}

/** Eigene Badges mit Feder-Physik & 3D-Neigung. */
export function ShopBadges({ badges, accent, size = "md" }: { badges: ShopBadge[]; accent: string; size?: "sm" | "md" }) {
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b, i) => (
        <TiltBadge key={`${b.text}-${i}`} badge={b} accent={accent} index={i} size={size} />
      ))}
    </div>
  );
}

function TiltBadge({ badge, accent, index, size }: { badge: ShopBadge; accent: string; index: number; size: "sm" | "md" }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 300, damping: 18 });
  const sry = useSpring(ry, { stiffness: 300, damping: 18 });
  const pad = size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs";

  const styleMap: Record<ShopBadge["style"], CSSProperties> = {
    pill: { background: `color-mix(in oklab, ${accent} 16%, var(--card))`, color: "var(--brand-ink)", border: `1px solid color-mix(in oklab, ${accent} 35%, transparent)` },
    neon: { background: "var(--card)", color: accent, border: `1.5px solid ${accent}`, boxShadow: `0 0 14px color-mix(in oklab, ${accent} 55%, transparent)` },
    sticker: { background: accent, color: "var(--primary-foreground)", border: "2px solid var(--card)", boxShadow: "0 6px 0 -2px color-mix(in oklab, var(--brand-ink) 25%, transparent)", rotate: `${index % 2 ? 3 : -3}deg` },
    minimal: { background: "transparent", color: "var(--brand-ink)", border: "1px dashed color-mix(in oklab, var(--brand-ink) 30%, transparent)" },
  };

  return (
    <motion.span
      initial={{ opacity: 0, y: 12, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.1 + index * 0.07 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 30);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 30);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={{ ...styleMap[badge.style], rotateX: srx, rotateY: sry, transformPerspective: 400 }}
      className={`inline-flex select-none items-center gap-1.5 rounded-full font-bold ${pad}`}
    >
      <span>{badge.emoji}</span>
      {badge.text}
    </motion.span>
  );
}

/** Wrapper für Produktkarten: Einflug + gewählter Interaktions-Effekt. */
export function FxCard({ theme, index, children }: { theme: ShopTheme; index: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 16 });
  const sry = useSpring(ry, { stiffness: 220, damping: 16 });
  const glareX = useTransform(sry, [-14, 14], ["0%", "100%"]);

  const initial =
    theme.entrance === "pop" ? { opacity: 0, scale: 0.7 } : theme.entrance === "slide" ? { opacity: 0, x: index % 2 ? 60 : -60 } : { opacity: 0, y: 40 };

  const hover =
    theme.cardFx === "zoom" ? { scale: 1.04, y: -6 } : theme.cardFx === "pop" ? { scale: 1.07, rotate: index % 2 ? 1.5 : -1.5 } : theme.cardFx === "tilt" ? { scale: 1.03 } : {};

  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : initial}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: (index % 8) * 0.06 }}
      whileHover={reduce ? undefined : hover}
      whileTap={{ scale: 0.97 }}
      onPointerMove={(e) => {
        if (theme.cardFx !== "tilt" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 28);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 28);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={theme.cardFx === "tilt" ? { rotateX: srx, rotateY: sry, transformPerspective: 900 } : undefined}
      className="relative rounded-2xl"
    >
      {children}
      {theme.cardFx === "tilt" && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 mix-blend-soft-light transition-opacity duration-300 [div:hover>&]:opacity-60"
          style={{
            background: "radial-gradient(circle at var(--gx) 30%, var(--card), transparent 55%)",
            ["--gx" as string]: glareX,
          }}
        />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl ring-0 ring-[var(--shop-accent)] transition-all duration-300 [div:hover>&]:ring-2"
      />
    </motion.div>
  );
}
