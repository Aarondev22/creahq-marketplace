import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppNotification = {
  id: string;
  title: string;
  body: string | null;
  category: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function useNotifications() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("notifications")
      .select("id,title,body,category,link,read_at,created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data ?? []) as AppNotification[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      if (!active) return;
      setUserId(uid);
      if (!uid) { setItems([]); setLoading(false); return; }
      load(uid);
      channel = supabase
        .channel(`notifications:${uid}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          (payload) => setItems((prev) => [payload.new as AppNotification, ...prev].slice(0, 30)),
        )
        .subscribe();
    });

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [load]);

  const unread = items.filter((n) => !n.read_at).length;

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  }

  async function markAllRead() {
    if (!userId) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await supabase.from("notifications").update({ read_at: now }).eq("user_id", userId).is("read_at", null);
  }

  return { items, unread, loading, markRead, markAllRead, signedIn: Boolean(userId) };
}
