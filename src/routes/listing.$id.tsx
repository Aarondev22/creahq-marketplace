*** Begin Patch
*** Update File: src/routes/listing.$id.tsx
@@
-import {
-  ArrowLeft,
-  Heart,
-  Share2,
-  Shield,
-  Truck,
-  Download,
-  MessageCircle,
-  Star,
-  Package,
-} from "lucide-react";
+import {
+  ArrowLeft,
+  Heart,
+  Share2,
+  Shield,
+  Truck,
+  Download,
+  MessageCircle,
+  Star,
+  Package,
+} from "lucide-react";
+import { ReportButton } from "@/components/ReportButton";
@@
-          <div className="mt-6 flex flex-wrap gap-2">
+          <div className="mt-6 flex flex-wrap gap-2">
             <button
               type="button"
               onClick={handleAddToCart}
               className="min-w-[200px] flex-1 rounded-full bg-brand px-6 py-4 text-base font-bold text-primary-foreground brand-glow transition-transform hover:scale-[1.02]"
             >
               In den Warenkorb
             </button>
@@
           <button
             type="button"
             onClick={handleShare}
             aria-label="Teilen"
             title="Teilen"
             className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink transition-colors hover:border-brand hover:text-brand"
           >
             <Share2 className="h-5 w-5" />
           </button>
+          <div className="ml-1 mt-1">
+            <ReportButton targetType="listing" targetId={l.id} />
+          </div>
         </div>
*** End Patch
