import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({
  texts: z.array(z.string().min(1).max(500)).min(1).max(80),
  lang: z.string().min(2).max(5),
});

/**
 * Translate an array of short UI strings into the target ISO-639-1 language.
 * Returns an array of the same length in the same order. The model is asked
 * to answer with a strict JSON array so we can parse it deterministically.
 */
export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt =
      `Translate each string in the JSON array below into ${data.lang} (ISO-639-1). ` +
      `Preserve punctuation, emojis, numbers, casing style and line breaks. ` +
      `Do NOT translate brand names like "CreaHQ". ` +
      `Return ONLY a JSON array of strings of the SAME length and SAME order, no markdown, no prose.\n\n` +
      JSON.stringify(data.texts);

    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      messages: [{ role: "user", content: prompt }],
    });

    const raw = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length === data.texts.length && parsed.every((x) => typeof x === "string")) {
        return { translations: parsed as string[] };
      }
    } catch { /* noop */ }
    return { translations: data.texts };
  });
