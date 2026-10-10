// Client-side mirror of the database chat guard: warns before a risky message is sent.
export type ChatRisk = { kind: string; label: string } | null;

export function detectChatRisk(text: string): ChatRisk {
  const b = text.toLowerCase();
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(b)) return { kind: "email", label: "E-Mail-Adresse" };
  if (/de[0-9]{20}/.test(b.replace(/\s/g, ""))) return { kind: "iban", label: "Bankverbindung (IBAN)" };
  if (/(\+|00)?[0-9]{9,}/.test(b.replace(/[\s\-/().]/g, ""))) return { kind: "phone", label: "Telefonnummer" };
  if (/(paypal|whatsapp|telegram|signal|überweis|ueberweis|freunde ?& ?familie|friends ?and ?family|wa\.me|t\.me)/.test(b))
    return { kind: "offsite", label: "Zahlung oder Kontakt außerhalb von CreaHQ" };
  return null;
}
