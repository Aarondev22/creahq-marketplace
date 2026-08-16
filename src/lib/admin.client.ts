export type ServerResponse<T = unknown> = { ok: boolean; error?: string; data?: T };
async function post<T = unknown>(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const json = await res.json();
      msg = json?.error ?? JSON.stringify(json);
    } catch (e) {
      try {
        const text = await res.text();
        if (text) msg = text;
      } catch {}
    }
    throw new Error(msg);
  }

  try {
    return (await res.json()) as ServerResponse<T> | T;
  } catch {
    return null as unknown as T;
  }
}

export async function banUser(data: { userId: string; ban: boolean }) {
  return post<{ ok: boolean }>("/api/admin/banUser", data);
}

export async function resolveReport(data: { id: string; status: "resolved" | "dismissed"; adminNote?: string }) {
  return post<{ ok: boolean }>("/api/admin/resolveReport", data);
}

export async function moderateListing(data: { id: string; moderation_status: "approved" | "rejected"; moderation_note?: string }) {
  return post<{ ok: boolean }>("/api/admin/moderateListing", data);
}

export async function toggleUserRole(data: { targetUserId: string; role: string; action: "add" | "remove" }) {
  return post<{ ok: boolean }>("/api/admin/toggleUserRole", data);
}
