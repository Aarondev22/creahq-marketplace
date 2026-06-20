import type { ReactNode } from "react";

export function PageShell({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      {eyebrow && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
          {eyebrow}
        </div>
      )}
      <h1 className="font-display text-3xl font-black tracking-tight text-brand-ink sm:text-5xl">
        {title}
      </h1>
      {lead && <p className="mt-3 text-base text-muted-foreground sm:text-lg">{lead}</p>}
      <div className="prose prose-neutral mt-8 max-w-none text-[15px] leading-relaxed text-foreground/90 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-brand-ink [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-brand-ink [&_a]:text-brand [&_a]:underline [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:my-3">
        {children}
      </div>
    </section>
  );
}
