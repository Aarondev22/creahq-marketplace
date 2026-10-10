import { describe, it, expect } from "vitest";
import { escrowState } from "./escrow";

const now = new Date("2026-10-20T12:00:00Z").getTime();
describe("10-day escrow", () => {
  it("holds money 3 days after sale", () => expect(escrowState("2026-10-17T12:00:00Z", false, now)).toEqual({ state: "held", daysLeft: 7 }));
  it("releases after 10 days", () => expect(escrowState("2026-10-10T11:00:00Z", false, now).state).toBe("released"));
  it("freezes when a problem is open", () => expect(escrowState("2026-10-01T00:00:00Z", true, now).state).toBe("frozen"));
});
