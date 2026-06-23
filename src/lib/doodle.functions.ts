import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({ imageDataUrl: z.string().min(20) });

export const guessDoodle = createServerFn({ method: "POST" })
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
                "Du bist ein Doodle-Erkenner. Schau dir die Skizze an und antworte NUR mit 1-3 deutschen Stichworten (max. 6 Wörter gesamt), was darauf gezeichnet ist. Keine Sätze, keine Erklärung, kein Punkt am Ende. Wenn das Bild leer oder unklar ist, antworte mit 'unklar'.",
            },
            { type: "image", image: data.imageDataUrl },
          ],
        },
      ],
    });
    return { guess: text.trim().replace(/^["']|["']$/g, "").slice(0, 60) };
  });
