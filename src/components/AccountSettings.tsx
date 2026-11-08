import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, KeyRound, Mail } from "lucide-react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
export function AccountSettings() {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient(); const router = useRouter(); const navigate = useNavigate();
  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); if (password.length < 8) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message); else { setPassword(""); toast.success("Passwort geändert."); }
  }
  async function resend() {
    if (!user?.email) return;
    setBusy(true); const { error } = await supabase.auth.resend({ type: "signup", email: user.email }); setBusy(false);
    if (error) toast.error(error.message); else toast.success("Bestätigungsmail verschickt.");
  }
  async function signOut() {
    await qc.cancelQueries(); const { error } = await supabase.auth.signOut();
    if (error) return toast.error(error.message);
    qc.clear(); await router.invalidate(); navigate({ to: "/", replace: true });
  }
  return <div className="space-y-8">
    <div className="space-y-2 border-b border-border pb-6"><h3 className="flex items-center gap-2 font-medium"><Mail className="h-4 w-4" /> E-Mail</h3><p className="break-all text-sm text-muted-foreground">{user?.email}</p><p className="text-sm">{user?.email_confirmed_at ? "Bestätigt" : "Noch nicht bestätigt"}</p>{!user?.email_confirmed_at && <Button variant="outline" disabled={busy} onClick={resend}>Bestätigung erneut senden</Button>}</div>
    <form onSubmit={changePassword} className="space-y-3"><Label htmlFor="new-password">Neues Passwort</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Mindestens 8 Zeichen" /><Button type="submit" disabled={busy || password.length < 8}><KeyRound /> Passwort ändern</Button></form>
    <Button variant="outline" onClick={signOut}><LogOut /> Abmelden</Button>
  </div>;
}
