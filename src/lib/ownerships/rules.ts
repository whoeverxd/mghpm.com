export const ownershipStatuses = ["not_started", "documents_pending", "in_review", "verified", "rejected"] as const;
export type OwnershipStatus = (typeof ownershipStatuses)[number];

export const ownershipChecks = [
  "deedOnFile",
  "recordMatches",
  "ownerIdentity",
  "entityGoodStanding",
  "coOwnerAuthorization",
  "managementAgreement",
] as const;
export type OwnershipCheck = (typeof ownershipChecks)[number];

const transitions: Record<OwnershipStatus, OwnershipStatus[]> = {
  not_started: ["documents_pending", "in_review"],
  documents_pending: ["in_review"],
  in_review: ["verified", "rejected", "documents_pending"],
  rejected: ["in_review"],
  verified: ["in_review"],
};

export function canTransition(from: OwnershipStatus, to: OwnershipStatus) {
  return transitions[from]?.includes(to) ?? false;
}

/** Percentages are stored with two decimals; sums are compared in hundredths to avoid float drift. */
export function roundPct(value: number) {
  return Math.round(value * 100) / 100;
}

export function isValidPct(value: number) {
  return Number.isFinite(value) && value >= 0.01 && value <= 100 && roundPct(value) === value;
}

export function availablePct(activePcts: number[]) {
  const usedHundredths = activePcts.reduce((sum, pct) => sum + Math.round(pct * 100), 0);
  return Math.max(0, 10000 - usedHundredths) / 100;
}
