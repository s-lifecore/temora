import { describe, expect, it } from "vitest";
import { buildAxes, decide, shortlist, threshold, type MarkTable } from "./rules";

describe("threshold", () => {
  it("5人未満は全員、5人以上は3分の2以上", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map(threshold)).toEqual([1, 2, 3, 4, 4, 4, 5, 6, 6]);
  });
});

describe("shortlist", () => {
  const axes = buildAxes(["スマホで動く", "2日で作れる"], [{ id: "B", must_haves: ["AIを使う"] }]);
  const ideas = ["a", "b", "c", "d", "e"].map((id) => ({ id }));

  it("譲れない軸で✕の案を外し、○の多い順に最大3案", () => {
    const marks: MarkTable = {
      a: { t0: "o", t1: "d", "m:B:0": "o" },
      b: { t0: "o", t1: "o", "m:B:0": "x" },
      c: { t0: "o", t1: "o", "m:B:0": "o" },
      d: { t0: "d", t1: "d", "m:B:0": "d" },
      e: { t0: "x", t1: "x", "m:B:0": "o" },
    };
    const r = shortlist(ideas, axes, marks);
    expect(r.ids).toEqual(["c", "a", "d"]);
    expect(r.excluded).toEqual([{ id: "b", axisIds: ["m:B:0"] }]);
  });

  it("全案が✕なら✕の少ない順で出す", () => {
    const marks: MarkTable = { a: { "m:B:0": "x" }, b: { "m:B:0": "x" } };
    expect(shortlist(ideas.slice(0, 2), axes, marks).ids).toEqual(["a", "b"]);
  });
});

describe("decide", () => {
  const ids = ["a", "b", "c"];
  const v = (memberId: string, ...approved: string[]) => ({ memberId, approved });

  it("4人なら全員承認の案で決定", () => {
    const r = decide(ids, [v("1", "a", "b"), v("2", "a"), v("3", "a", "c"), v("4", "a", "b")], false);
    expect(r).toEqual({ kind: "decided", ideaId: "a", by: "approval" });
  });

  it("6人なら4票で決定、条件を満たす中で最多", () => {
    const votes = [v("1", "a", "b"), v("2", "a", "b"), v("3", "a", "b"), v("4", "a", "b"), v("5", "b"), v("6", "c")];
    expect(decide(ids, votes, false)).toEqual({ kind: "decided", ideaId: "b", by: "approval" });
  });

  it("条件を満たす案が同数なら tie", () => {
    const votes = [v("1", "a", "b"), v("2", "a", "b"), v("3", "a", "b")];
    expect(decide(ids, votes, false)).toEqual({ kind: "tie", ids: ["a", "b"], by: "approval" });
  });

  it("1回目で満たさなければ retry、2回目は最多票", () => {
    const votes = [v("1", "a"), v("2", "a"), v("3", "b")];
    expect(decide(ids, votes, false)).toEqual({ kind: "retry" });
    expect(decide(ids, votes, true)).toEqual({ kind: "decided", ideaId: "a", by: "most" });
  });

  it("最終回の最多票が同数なら tie", () => {
    expect(decide(ids, [v("1", "a"), v("2", "b")], true)).toEqual({ kind: "tie", ids: ["a", "b"], by: "most" });
  });

  it("同じ案への重複承認は1票", () => {
    expect(decide(ids, [v("1", "a", "a"), v("2", "b")], true)).toEqual({ kind: "tie", ids: ["a", "b"], by: "most" });
  });
});
