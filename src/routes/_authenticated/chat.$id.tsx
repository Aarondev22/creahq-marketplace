import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type ChatMessage = {
  id?: string;
  body?: string;
  sender_id?: string;
};

export const Route = createFileRoute("/_authenticated/chat/$id")({
  ssr: false,
  component: ChatRoute,
});

export default function ChatRoute({ params }: { params: { id: string } }) {
  const { id } = params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    let alive = true;

    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          if (!alive) return;
          setMessages((m) => [...m, payload.new as ChatMessage]);
        },
      )
      .subscribe();

    return () => {
      // cleanup
      try {
        channel.unsubscribe();
      } catch (e) {
        // ignore
      }
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div>
      <h2 className="text-lg font-medium">Chat</h2>
      <ul>
        {messages.map((m, i) => (
          <li key={m.id ?? i}>{m.body}</li>
        ))}
      </ul>
    </div>
  );
}
