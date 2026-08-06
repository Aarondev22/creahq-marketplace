*** Begin Patch
*** Update File: src/components/admin/AdminPanel.tsx
@@
   async function banSeller(sellerId: string) {
-    const { error } = await supabase.from("profiles").update({ banned: true }).eq("id", sellerId);
-    if (error) return toast.error(error.message);
-    toast.success("Verkäufer gesperrt");
-    load();
+    try {
+      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
+      const { error } = await supabaseAdmin.from("profiles").update({ banned: true }).eq("id", sellerId);
+      if (error) throw error;
+      toast.success("Verkäufer gesperrt");
+      load();
+    } catch (err) {
+      toast.error(err instanceof Error ? err.message : "Fehler beim Sperren des Verkäufers");
+    }
   }
*** End Patch
