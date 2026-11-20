export type Mark = "o" | "d" | "x";

export type Axis = {
  id: string;
  label: string;
  kind: "team" | "must";
  ownerId?: string;
};

export type MarkTable = Record<string, Record<string, Mark>>;

export const MAX_SHORTLIST = 3;
export const MAX_MUST_HAVES = 2;

const SCORE: Record<Mark, number> = { o: 2, d: 1, x: 0 };

export function threshold(voters: number): number {
  if (voters <= 0) return 0;
  return voters < 5 ? voters : Math.ceil((voters * 2) / 3);
}

export function buildAxes(teamAxes: string[], members: { id: string; must_haves: string[] }[]): Axis[] {
  const team: Axis[] = teamAxes.map((label, i) => ({ id: `t${i}`, label, kind: "team" }));
  const must: Axis[] = members.flatMap((m) =>
    m.must_haves.map((label, i) => ({ id: `m:${m.id}:${i}`, label, kind: "must" as const, ownerId: m.id })),
  );
  return [...team, ...must];
}

type Ranked = { id: string; score: number; mustX: number; order: number };

export function shortlist(
  ideas: { id: string }[],
  axes: Axis[],
  marks: MarkTable,
  max = MAX_SHORTLIST,
): { ids: string[]; excluded: { id: string; axisIds: string[] }[] } {
  const ranked: Ranked[] = ideas.map((idea, order) => {
    const row = marks[idea.id] ?? {};
    let score = 0;
    let mustX = 0;
    for (const axis of axes) {
      const m = row[axis.id] ?? "d";
      score += SCORE[m];
      if (axis.kind === "must" && m === "x") mustX++;
    }
    return { id: idea.id, score, mustX, order };
  });

  const byScore = (a: Ranked, b: Ranked) => b.score - a.score || a.mustX - b.mustX || a.order - b.order;
  const alive = ranked.filter((r) => r.mustX === 0).sort(byScore);
  const vetoed = ranked.filter((r) => r.mustX > 0);
  const excluded = vetoed.map((r) => ({
    id: r.id,
    axisIds: axes.filter((a) => a.kind === "must" && marks[r.id]?.[a.id] === "x").map((a) => a.id),
  }));

  if (alive.length > 0) return { ids: alive.slice(0, max).map((r) => r.id), excluded };

  const fallback = [...vetoed].sort((a, b) => a.mustX - b.mustX || byScore(a, b));
  return { ids: fallback.slice(0, max).map((r) => r.id), excluded: [] };
}

export type Vote = { memberId: string; approved: string[] };

export function tally(candidateIds: string[], votes: Vote[]): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(candidateIds.map((id) => [id, 0]));
  for (const v of votes) {
    for (const id of new Set(v.approved)) if (id in counts) counts[id]++;
  }
  return counts;
}

export type Outcome =
  | { kind: "decided"; ideaId: string; by: "approval" | "most" }
  | { kind: "tie"; ids: string[]; by: "approval" | "most" }
  | { kind: "retry" };

export function decide(candidateIds: string[], votes: Vote[], finalRound: boolean): Outcome {
  const counts = tally(candidateIds, votes);
  const th = threshold(votes.length);
  const qualifying = votes.length > 0 ? candidateIds.filter((id) => counts[id] >= th) : [];

  const pickMax = (ids: string[], by: "approval" | "most"): Outcome => {
    const best = Math.max(...ids.map((id) => counts[id]));
    const top = ids.filter((id) => counts[id] === best);
    return top.length === 1 ? { kind: "decided", ideaId: top[0], by } : { kind: "tie", ids: top, by };
  };

  if (qualifying.length > 0) return pickMax(qualifying, "approval");
  if (!finalRound) return { kind: "retry" };
  return pickMax(candidateIds, "most");
}
