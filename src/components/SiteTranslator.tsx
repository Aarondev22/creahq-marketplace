import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { translateBatch } from "@/lib/translate.functions";

const LS_LANG = "creahq:lang";
const LS_CACHE_PREFIX = "creahq:tr:";
const SOURCE_LANG = "de";

type NodeRec = { node: Text; original: string };

export function SiteTranslator() {
  const router = useRouter();
  const path = router.state.location.pathname;
  const nodesRef = useRef<NodeRec[]>([]);
  const translateFn = useServerFn(translateBatch);
  const runIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const run = async () => {
      const myRun = ++runIdRef.current;
      await new Promise((r) => setTimeout(r, 120));
      if (myRun !== runIdRef.current) return;

      const lang = (() => {
        try { return localStorage.getItem(LS_LANG) || SOURCE_LANG; } catch { return SOURCE_LANG; }
      })().toLowerCase();

      const recs: NodeRec[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const t = node.nodeValue?.trim() ?? "";
          if (!t) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest("script,style,code,pre,noscript,[data-notranslate]")) return NodeFilter.FILTER_REJECT;
          if (!/[a-zA-ZäöüÄÖÜß]/.test(t)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const seen = new WeakSet<Text>();
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
        // Nur zurücksetzen, wenn vorher wirklich übersetzt wurde — sonst würden
        // legitime UI-Text-Updates (z.B. Theme-Name) überschrieben.
        if (translatedRef.current.size > 0) {
          recs.forEach((r) => {
            if (translatedRef.current.has(r.node) && r.node.nodeValue !== r.original) r.node.nodeValue = r.original;
          });
          translatedRef.current = new WeakSet<Text>();
          translatedCountRef.current = 0;
        }
        return;
      }

      let cache: Record<string, string> = {};
      const cacheKey = LS_CACHE_PREFIX + lang;
      try { cache = JSON.parse(localStorage.getItem(cacheKey) || "{}"); } catch { /* noop */ }

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

      const CHUNK = 40;
      for (let i = 0; i < missing.length; i += CHUNK) {
        if (myRun !== runIdRef.current) return;
        const chunk = missing.slice(i, i + CHUNK);
        try {
          const { translations } = await translateFn({ data: { texts: chunk, lang } });
          chunk.forEach((src, idx) => { cache[src] = translations[idx] ?? src; });
          try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch { /* quota */ }
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

    // NEU: Läuft erneut bei jeder relevanten DOM-Änderung (Modals, Popovers,
    // async geladene Listings, etc.) — mit Debounce, damit es nicht bei jedem
    // einzelnen kleinen Update feuert.
    const observer = new MutationObserver(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => { void run(); }, 250);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    const onLang = () => void run();
    window.addEventListener("creahq:lang-change", onLang);

    return () => {
      window.removeEventListener("creahq:lang-change", onLang);
      observer.disconnect();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [path, translateFn]);

  return null;
}

function preserveWhitespace(original: string, translated: string): string {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return leading + translated.trim() + trailing;
}
