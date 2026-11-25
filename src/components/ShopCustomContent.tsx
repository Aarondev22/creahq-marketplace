import { buildSandboxDoc, type ShopCode } from "@/lib/shopCode";

export function ShopCustomContent({ code }: { code: ShopCode }) {
  if (code.mode === "blocks") {
    if (code.blocks.length === 0) return null;
    return (
      <section className="mt-10 grid gap-4">
        {code.blocks.map((b, i) => (
          <div key={i} className="rounded-3xl border border-border bg-card p-5">
            {b.type === "heading" && <h2 className="font-display text-2xl font-black text-brand-ink">{b.title}</h2>}
            {b.type === "text" && (
              <>
                {b.title && <h3 className="font-display text-xl font-black text-brand-ink">{b.title}</h3>}
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{b.body}</p>
              </>
            )}
            {b.type === "banner" && (
              <div className="rounded-2xl bg-brand-soft px-5 py-6">
                <h3 className="font-display text-xl font-black text-brand-ink">{b.title}</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{b.body}</p>
              </div>
            )}
            {b.type === "quote" && (
              <blockquote className="text-lg font-semibold italic text-brand-ink">
                „{b.text}“ {b.author && <span className="block text-sm not-italic text-muted-foreground">— {b.author}</span>}
              </blockquote>
            )}
            {b.type === "faq" && (
              <details>
                <summary className="cursor-pointer font-bold text-brand-ink">{b.q}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{b.a}</p>
              </details>
            )}
            {b.type === "image" && <img src={b.url} alt="" className="w-full rounded-2xl object-cover" />}
            {b.type === "button" && (
              <a href={b.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-bold text-primary-foreground">
                {b.label || "Mehr erfahren"}
              </a>
            )}
            {b.type === "divider" && <hr className="border-border" />}
            {b.type === "spacer" && <div aria-hidden="true" style={{ height: b.height }} />}
          </div>
        ))}
      </section>
    );
  }
  if (!code.html.trim()) return null;
  return <CodeFrame html={code.html} css={code.css} />;
}

export function CodeFrame({ html, css }: { html: string; css: string }) {
  return (
    <iframe
      title="Shop-Bereich"
      sandbox=""
      srcDoc={buildSandboxDoc(html, css)}
      className="mt-10 h-96 w-full rounded-3xl border border-border bg-card"
    />
  );
}
