import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { translateBatch } from "@/lib/translate.functions";

const LS_LANG = "creahq:lang";
const LS_CACHE_PREFIX = "creahq:tr:";
const SOURCE_LANG = "de";

type NodeRec = { node: Text; original: string };

/**
 * Walks the live DOM after each route change and translates visible text
 * nodes into the language stored under `creahq:lang`. Originals are kept in
 * memory so switching back to German (or between languages) restores them.
 * Translations are cached in localStorage per target language to avoid
 * spamming the AI gateway. Marketing/branding stays untouched; nodes with
 * `data-notranslate` or inside <script>/<style>/<code>/<pre> are skipped.
 */
export function SiteTranslator() {
  const router = useRouter();
  const path = router.state.location.pathname;
  const nodesRef = useRef<NodeRec[]>([]);
  const translateFn = useServerFn(translateBatch);
  const runIdRef = useRef(0);

  useEffect(() => {
    const run = async () => {
      const myRun = ++runIdRef.current;
      // Give the freshly-mounted route a tick to render.
      await new Promise((r) => setTimeout(r, 120));
      if (myRun !== runIdRef.current) return;

      const lang = (() => {
        try { return localStorage.getItem(LS_LANG) || SOURCE_LANG; } catch { return SOURCE_LANG; }
      })().toLowerCase();

      // Refresh the node map from the current DOM.
      const recs: NodeRec[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const t = node.nodeValue?.trim() ?? "";
          if (!t) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest("script,style,code,pre,noscript,[data-notranslate]")) return NodeFilter.FILTER_REJECT;
          // Skip pure numbers / symbols
          if (!/[a-zA-ZäöüÄÖÜß]/.test(t)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const seen = new WeakSet<Text>();
      // Remember originals we already know about
      const oldMap = new Map<Text, string>();
      nodesRef.current.forEach((r) => oldMap.set(r.node, r.original));

      let cur: Node | null;
      while ((cur = walker.nextNode())) {
        const tn = cur as Text;
        if (seen.has(tn)) continue;
        seen.add(tn);
        const original = oldMap.get(tn) ?? tn.nodeValue ?? "";
        recs.push({ node: tn, original });
      }
      nodesRef.current = recs;

      document.documentElement.lang = lang;

      if (lang === SOURCE_LANG) {
        // Restore originals
        recs.forEach((r) => { if (r.node.nodeValue !== r.original) r.node.nodeValue = r.original; });
        return;
      }

      // Load cache
      let cache: Record<string, string> = {};
      const cacheKey = LS_CACHE_PREFIX + lang;
      try { cache = JSON.parse(localStorage.getItem(cacheKey) || "{}"); } catch { /* noop */ }

      // Apply cached translations first, collect misses
      const misses = new Set<string>();
      for (const r of recs) {
        const key = r.original.trim();
        if (!key) continue;
        const cached = cache[key];
        if (cached) {
          if (r.node.nodeValue !== cached) r.node.nodeValue = preserveWhitespace(r.original, cached);
        } else {
          misses.add(key);
        }
      }

      const missing = Array.from(misses);
      if (!missing.length) return;

      // Batch to keep prompts small
      const CHUNK = 40;
      for (let i = 0; i < missing.length; i += CHUNK) {
        if (myRun !== runIdRef.current) return;
        const chunk = missing.slice(i, i + CHUNK);
        try {
          const { translations } = await translateFn({ data: { texts: chunk, lang } });
          chunk.forEach((src, idx) => { cache[src] = translations[idx] ?? src; });
          try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch { /* quota */ }
          // Apply the fresh translations to current nodes
          for (const r of nodesRef.current) {
            const key = r.original.trim();
            const t = cache[key];
            if (t && r.node.nodeValue !== t) r.node.nodeValue = preserveWhitespace(r.original, t);
          }
        } catch (e) {
          console.warn("translate chunk failed", e);
          break;
        }
      }
    };

    void run();

    const onLang = () => void run();
    window.addEventListener("creahq:lang-change", onLang);
    return () => window.removeEventListener("creahq:lang-change", onLang);
  }, [path, translateFn]);

  return null;
}

function preserveWhitespace(original: string, translated: string): string {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return leading + translated.trim() + trailing;
}
