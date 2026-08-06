@@
*** Begin Patch
*** Update File: src/components/topbar/NotificationsBell.tsx
@@
-const ICONS: Record<string, React.ReactNode> = {
-  chat: <MessageCircle className="h-4 w-4" />,
-  order: <ShoppingBag className="h-4 w-4" />,
-  sale: <Package className="h-4 w-4" />,
-  shipment: <Truck className="h-4 w-4" />,
-};
-
-const FILTERS = [
-  ["all", "Alle"],
-  ["chat", "Nachrichten"],
-  ["order", "Bestellung"],
-  ["sale", "Verkauf"],
-  ["shipment", "Versand"],
-] as const;
+const ICONS: Record<string, React.ReactNode> = {
+  message: <MessageCircle className="h-4 w-4" />,
+  order: <ShoppingBag className="h-4 w-4" />,
+  sale: <Package className="h-4 w-4" />,
+  shipment: <Truck className="h-4 w-4" />,
+};
+
+const FILTERS = [
+  ["all", "Alle"],
+  ["message", "Nachrichten"],
+  ["order", "Bestellung"],
+  ["sale", "Verkauf"],
+  ["shipment", "Versand"],
+] as const;
@@
-  const [filter, setFilter] = useState<"all" | "chat" | "order" | "sale" | "shipment">("all");
+  const [filter, setFilter] = useState<"all" | "message" | "order" | "sale" | "shipment">("all");
@@
-  const CAT_STYLE: Record<string, string> = {
-    chat: "bg-sky-100 text-sky-700",
-    order: "bg-amber-100 text-amber-700",
-    sale: "bg-emerald-100 text-emerald-700",
-    shipment: "bg-violet-100 text-violet-700",
-  };
+  const CAT_STYLE: Record<string, string> = {
+    message: "bg-sky-100 text-sky-700",
+    order: "bg-amber-100 text-amber-700",
+    sale: "bg-emerald-100 text-emerald-700",
+    shipment: "bg-violet-100 text-violet-700",
+  };
*** End Patch
