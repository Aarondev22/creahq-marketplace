*** Begin Patch
*** Update File: src/components/admin/AdminPanel.tsx
@@
-  async function resolve(id: string, status: "resolved" | "dismissed") {
-    const { error } = await supabase.from("reports").update({ status }).eq("id", id);
-    if (error) return toast.error(error.message);
-    toast.success("Meldung aktualisiert");
-    load();
-  }
+  async function resolve(id: string, status: "resolved" | "dismissed") {
+    try {
+      await resolveReportFn({ data: { id, status } });
+      toast.success("Meldung aktualisiert");
+      load();
+    } catch (err) {
+      toast.error(err instanceof Error ? err.message : "Fehler beim Aktualisieren der Meldung");
+    }
+  }
@@
-  async function setModeration(id: string, status: "approved" | "rejected") {
-    const { error } = await supabase.from("listings").update({ moderation_status: status }).eq("id", id);
-    if (error) return toast.error(error.message);
-    toast.success(status === "approved" ? "Listing freigegeben" : "Listing abgelehnt");
-    load();
-  }
+  async function setModeration(id: string, status: "approved" | "rejected") {
+    try {
+      await moderateListing({ data: { id, moderation_status: status === 'approved' ? 'approved' : 'rejected' } });
+      toast.success(status === "approved" ? "Listing freigegeben" : "Listing abgelehnt");
+      load();
+    } catch (err) {
+      toast.error(err instanceof Error ? err.message : "Fehler bei der Moderation");
+    }
+  }
*** End Patch
