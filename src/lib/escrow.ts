// 10-day escrow: seller money unlocks 10 days after the sale unless a problem report is open.
export const ESCROW_DAYS = 10;
const DAY = 86_400_000;

export type EscrowState = "held" | "frozen" | "released";

export function escrowState(createdAt: string, hasOpenReport: boolean, now = Date.now()) {
  if (hasOpenReport) return { state: "frozen" as EscrowState, daysLeft: 0 };
  const left = Math.ceil((new Date(createdAt).getTime() + ESCROW_DAYS * DAY - now) / DAY);
  return left > 0 ? { state: "held" as EscrowState, daysLeft: left } : { state: "released" as EscrowState, daysLeft: 0 };
}
