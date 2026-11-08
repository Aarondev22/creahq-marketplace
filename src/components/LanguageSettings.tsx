import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FlagLangDoodle } from "@/components/FlagLangDoodle";
import { List, Paintbrush, Check } from "lucide-react";
import { toast } from "sonner";
const languages = [["de", "Deutsch"], ["en", "English"], ["fr", "Français"], ["es", "Español"], ["it", "Italiano"], ["nl", "Nederlands"], ["pl", "Polski"], ["tr", "Türkçe"]];
export function LanguageSettings() {
  const [mode, setMode] = useState<"list" | "draw">("list");
  const [current, setCurrent] = useState("de");
  useEffect(() => { setCurrent(localStorage.getItem("creahq:lang") ?? "de"); }, []);
  function pick(code: string, label: string) {
    localStorage.setItem("creahq:lang", code); setCurrent(code);
    window.dispatchEvent(new CustomEvent("creahq:lang-change", { detail: { lang: code } }));
    toast.success(`Sprache: ${label}`);
  }
  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-2">
      <Button variant={mode === "list" ? "secondary" : "outline"} className="h-auto min-h-11 whitespace-normal" onClick={() => setMode("list")}><List /> Wählen</Button>
      <Button variant={mode === "draw" ? "secondary" : "outline"} className="h-auto min-h-11 whitespace-normal" onClick={() => setMode("draw")}><Paintbrush /> Malen</Button>
    </div>
    {mode === "list" ? <div className="grid grid-cols-2 gap-2">{languages.map(([code, label]) => <Button key={code} variant="outline" className="min-h-11 justify-between" aria-pressed={current === code} onClick={() => pick(code, label)}>{label}{current === code && <Check />}</Button>)}</div> : <FlagLangDoodle />}
  </div>;
}
