import { describe, it, expect } from "vitest";
import { detectChatRisk } from "./chatGuard";

describe("chat guard", () => {
  it("blocks PayPal Freunde", () => expect(detectChatRisk("zahl per PayPal Freunde")?.kind).toBe("offsite"));
  it("blocks IBAN", () => expect(detectChatRisk("DE89 3704 0044 0532 0130 00")?.kind).toBe("iban"));
  it("blocks phone numbers", () => expect(detectChatRisk("ruf an 0171 1234567")?.kind).toBe("phone"));
  it("blocks emails", () => expect(detectChatRisk("schreib an a@b.de")?.kind).toBe("email"));
  it("allows normal text", () => expect(detectChatRisk("Ist das noch da? Gerne 2 Stück")).toBeNull());
});
