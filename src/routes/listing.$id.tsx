@@
--- a/src/routes/listing.$id.tsx
+++ b/src/routes/listing.$id.tsx
@@
-        {allImages.length > 1 && (
-          <div className="grid grid-cols-4 gap-2">
-            {allImages.map((src, i) => (
-              <button
-                key={`${src}-${i}`}
-                type="button"
-                onClick={() => setActiveImg(i)}
-                aria-label={`Bild ${i + 1} anzeigen`}
-                className={`aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
-                  i === activeImg ? "border-brand" : "border-border hover:border-brand/50"
-                }`}
-              >
-                <img src={src} alt={`${l.title} — Bild ${i + 1}`} className="h-full w-full object-cover" />
-              </button>
-            ))}
-          </div>
-        )}
+        {allImages.length > 1 && (
+          <GalleryThumbnails
+            images={allImages}
+            activeIndex={activeImg}
+            onActivate={(i) => setActiveImg(i)}
+            maxVisible={4}
+          />
+        )}
@@
+// Simple one-row thumbnail viewport component
+function GalleryThumbnails({
+  images,
+  activeIndex,
+  onActivate,
+  maxVisible = 4,
+}: {
+  images: string[];
+  activeIndex: number;
+  onActivate: (i: number) => void;
+  maxVisible?: number;
+}) {
+  const visible = Math.min(maxVisible, images.length);
+  const [start, setStart] = useState(0);
+
+  // clamp start
+  if (start > images.length - visible) setStart(Math.max(0, images.length - visible));
+
+  const canLeft = start > 0;
+  const canRight = start + visible < images.length;
+
+  return (
+    <div className="flex items-center gap-2">
+      {canLeft && (
+        <button
+          type="button"
+          aria-label="Vorherige Thumbnails"
+          onClick={() => setStart((s) => Math.max(0, s - visible))}
+          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card"
+        >
+          ‹
+        </button>
+      )}
+
+      <div className="grid grid-flow-col gap-2">
+        {images.slice(start, start + visible).map((src, i) => {
+          const idx = start + i;
+          return (
+            <button
+              key={`${src}-${idx}`}
+              type="button"
+              onClick={() => onActivate(idx)}
+              aria-label={`Bild ${idx + 1} anzeigen`}
+              className={`aspect-square h-20 w-20 overflow-hidden rounded-xl border-2 transition-colors ${
+                idx === activeIndex ? "border-brand" : "border-border hover:border-brand/50"
+              }`}
+            >
+              <img src={src} alt={`Vorschaubild ${idx + 1}`} className="h-full w-full object-cover" />
+            </button>
+          );
+        })}
+      </div>
+
+      {canRight && (
+        <button
+          type="button"
+          aria-label="Nächste Thumbnails"
+          onClick={() => setStart((s) => Math.min(images.length - visible, s + visible))}
+          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card"
+        >
+          ›
+        </button>
+      )}
+    </div>
+  );
+}
+
