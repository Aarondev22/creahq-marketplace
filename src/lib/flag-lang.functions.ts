import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({ imageDataUrl: z.string().min(20) });

/**
 * Recognizes a hand-drawn national flag and returns the target UI language.
 * The gateway model is told to answer with a strict JSON object so we can
 * parse it deterministically. Falls back to 'unklar' on any error.
 */
export const guessFlagLang = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Du siehst eine handgezeichnete Nationalflagge. Erkenne das Land und ordne die passende UI-Sprache zu. Antworte NUR mit gültigem JSON in genau diesem Schema: {\"country\":\"<deutscher Landesname>\",\"lang\":\"<ISO-639-1-Code>\"}. Wenn unklar: {\"country\":\"unklar\",\"lang\":\"unklar\"}. Kein Fließtext, kein Markdown.",
            },
            { type: "image", image: data.imageDataUrl },
          ],
        },
      ],
    });
    const raw = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    try {
      const parsed = JSON.parse(raw) as { country?: string; lang?: string };
      return {
        country: (parsed.country ?? "unklar").slice(0, 40),
        lang: (parsed.lang ?? "unklar").toLowerCase().slice(0, 5),
      };
    } catch {
      return { country: "unklar", lang: "unklar" };
    }
  });
