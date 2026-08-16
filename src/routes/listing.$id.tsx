
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
-import { ReportButton } from "@/components/ReportButton";
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
-            <button
-              type="button"
-              onClick={handleShare}
-              aria-label="Teilen"
-              title="Teilen"
-              className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink transition-colors hover:border-brand hover:text-brand"
-            >
-              <Share2 className="h-5 w-5" />
-            </button>
-          <div className="ml-1 mt-1">
-            <ReportButton targetType="listing" targetId={l.id} />
-          </div>
+            <button
+              type="button"
+              onClick={handleShare}
+              aria-label="Teilen"
+              title="Teilen"
+              className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-brand-ink transition-colors hover:border-brand hover:text-brand"
+            >
+              <Share2 className="h-5 w-5" />
+            </button>
+            <div className="ml-1 mt-1">
+              <ReportButton targetType="listing" targetId={l.id} />
+            </div>
           </div>
*** End Patch
