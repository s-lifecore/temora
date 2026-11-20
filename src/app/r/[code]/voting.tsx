"use client";

import { useState } from "react";
import { errorText } from "@/lib/client";
import { Matrix } from "./matrix";
import type { Act, RoomView } from "./room";
import { Results } from "./phases";

export function Voting({ view, act }: { view: RoomView; act: Act }) {
  const { room, me, members, ideas, axes } = view;
  const participant = members.find((m) => m.id === me.id)?.participant ?? false;
  const [picked, setPicked] = useState<string[]>(view.myVote ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const voters = members.filter((m) => m.participant);
  const votedCount = voters.filter((m) => m.voted).length;
  const sent = view.myVote !== null && JSON.stringify([...view.myVote].sort()) === JSON.stringify([...picked].sort());

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="space-y-5">
      {view.results.length > 0 && <Results view={view} />}

      <section className="card space-y-4">
        <div>
          <h2 className="font-bold">{room.round > 1 ? "改訂した候補" : "候補"}（{room.shortlist.length}案）</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            「これならいい」と思える案すべてに承認を付けてください。いくつ付けても構いません。AI は推薦していません。並びは ○ の多い順です。
          </p>
        </div>
        <Matrix
          view={view}
          ideaIds={room.shortlist}
          extra={(id) =>
            participant && (
              <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-sm has-checked:border-accent has-checked:bg-accent-soft">
                <input type="checkbox" className="accent-[var(--accent)]" checked={picked.includes(id)} onChange={() => toggle(id)} />
                これならいい
              </label>
            )
          }
        />
      </section>

      {participant ? (
        <section className="card space-y-3">
          <p className="text-sm">
            決定には、承認した人のうち
            <span className="font-semibold">{votedCount >= 5 ? "3分の2以上" : "全員"}</span>
            の承認が必要です（5人未満は全員、5人以上は3分の2以上）。いま {votedCount}/{voters.length} 人が送りました。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="btn"
              disabled={busy || sent}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await act.vote(picked);
                } catch (e) {
                  setError(errorText(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {sent ? "送信済み" : view.myVote ? "承認を送り直す" : picked.length ? `${picked.length}案を承認して送る` : "どれも承認せずに送る"}
            </button>
            {view.myVote && <span className="hint">締切までは送り直せます。</span>}
            {me.isHost && (
              <button className="btn-ghost ml-auto" onClick={() => act.host("close")}>
                今すぐ締め切る
              </button>
            )}
          </div>
          {error && <p className="text-sm text-x">{error}</p>}
        </section>
      ) : (
        <p className="card text-sm text-muted">案の締切までに提出しなかったため、今回の承認には参加できません。</p>
      )}

      {room.excluded.length > 0 && (
        <details className="card text-sm">
          <summary className="cursor-pointer font-semibold">譲れない条件で候補から外れた案（{room.excluded.length}案）</summary>
          <ul className="mt-3 space-y-2">
            {room.excluded.map((ex) => {
              const idea = ideas.find((i) => i.id === ex.id);
              return (
                <li key={ex.id}>
                  <span className="font-semibold">{idea?.title}</span>
                  <span className="text-muted">
                    {" "}
                    — ✕：{ex.axisIds.map((a) => axes.find((x) => x.id === a)?.label).join("、")}
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </div>
  );
}
