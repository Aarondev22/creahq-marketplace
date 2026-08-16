    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          setMessages((m) => [...m, payload.new as ChatMessage]);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      alive = false;
    };
