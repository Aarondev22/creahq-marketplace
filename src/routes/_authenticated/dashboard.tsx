*** Begin Patch
*** Update File: src/routes/_authenticated/dashboard.tsx
@@
-            <select value={data.kind} onChange={(e) => update("kind", e.target.value as "digital" | "service")} className="rounded-full border border-border bg-background px-4 py-2.5 text-sm focu[...]">
-              <option value="digital">Digital</option>
-              <option value="service">Service</option>
-            </select>
+            <select value={data.kind} onChange={(e) => update("kind", e.target.value as "digital" | "service")} className="rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none">
+              <option value="digital">Digital</option>
+              <option value="service">Physisch</option>
+            </select>
@@
-        <div className="space-y-4">
-          <h3 className="font-display text-xl font-bold text-brand-ink">Bilder & Details</h3>
-          <div>
-            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Bilder (erstes = Titelbild, max. 8)</label>
-            <input
-              type="file"
-              accept="image/*"
-              multiple
-              onChange={(e) => update("files", [...data.files, ...Array.from(e.target.files ?? [])].slice(0, 8))}
-              className="block w-full text-sm"
-            />
-          </div>
+        <div className="space-y-4">
+          <h3 className="font-display text-xl font-bold text-brand-ink">Bilder & Details</h3>
+          <div>
+            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Bilder (erstes = Titelbild, max. 8)</label>
+            <label className="relative inline-block w-full cursor-pointer">
+              <input
+                type="file"
+                accept="image/*"
+                multiple
+                onChange={(e) => update("files", [...data.files, ...Array.from(e.target.files ?? [])].slice(0, 8))}
+                className="sr-only"
+              />
+              <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-center">
+                <div className="text-sm font-semibold text-brand-ink">Bilder auswählen</div>
+                <div className="mt-1 text-xs text-muted-foreground">Klicke oder ziehe Dateien hierher</div>
+              </div>
+            </label>
+          </div>
*** End Patch
