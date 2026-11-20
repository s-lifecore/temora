export type PlanId = "free";

export type Plan = {
  label: string;
  roomsPerDay: number;
  maxMembers: number;
  maxIdeasPerMember: number;
  assistPerMember: number;
};

export const PLANS: Record<PlanId, Plan> = {
  free: { label: "無料", roomsPerDay: 5, maxMembers: 12, maxIdeasPerMember: 5, assistPerMember: 10 },
};

export const DEFAULT_PLAN: PlanId = "free";

export const planOf = (id: string | undefined): Plan => PLANS[(id ?? DEFAULT_PLAN) as PlanId] ?? PLANS[DEFAULT_PLAN];
