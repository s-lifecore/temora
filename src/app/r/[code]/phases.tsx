"use client";

import { useEffect, useState } from "react";
import { Matrix } from "./matrix";
import type { Act, RoomView } from "./room";

export function Working({ view, act }: { view: RoomView; act: Act }) {
  const { room, me } = view;
  const revising = room.phase === "revising";
  return (
    <section className="card space-y-3 text-center">
      {room.aiNeedsRetry ? (
        <>
          <p className="font-semibold text-x">AI の処理がうまくいきませんでした</p>
          {room.aiError && <p className="text-sm text-muted">{room.aiError}</p>}
          {me.isHost ? (
            <button className="btn" onClick={() => act.host("retry")}>
              もう一度試す
            </button>
          ) : (
            <p className="text-sm text-muted">ホストがやり直すのを待っています。</p>
          )}
        </>
      ) : (
        <>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-accent-soft border-t-accent" />
          <p className="font-semibold">
            {revising ? "集まった意見をもとに、候補を改訂しています" : "AI が全案を判断軸に照らしています"}
          </p>
          <p className="text-sm text-muted">
            全員の案を、同じモデル（
            <span className="font-mono">{room.model}</span>
            ）・同じ指示で、1回でまとめて判定します。誰の案かは AI に伝えていません。
          </p>
          {room.aiError && <p className="text-xs text-d">前回の失敗：{room.aiError}（自動でやり直しています）</p>}
        </>
      )}
    </section>
  );
}

export function Results({ view }: { view: RoomView }) {
  const title = (id: string) => view.ideas.find((i) => i.id === id)?.title ?? "?";
  return (
    <section className="card space-y-3">
      <h2 className="font-bold">承認の結果</h2>
      {view.results.map((r) => {
        const max = Math.max(1, ...Object.values(r.counts));
        return (
          <div key={r.round} className="space-y-2">
            <p className="text-xs text-muted">
              {r.round}回目：{r.voters}人が承認を送信・決定に必要な承認 {r.threshold}
            </p>
            <ul className="space-y-1.5">
              {Object.entries(r.counts)
                .sort((a, b) => b[1] - a[1])
                .map(([id, n]) => (
                  <li key={id} className="text-sm">
                    <div className="flex justify-between gap-2">
                      <span>{title(id)}</span>
                      <span className={n >= r.threshold && r.voters > 0 ? "font-bold text-o" : "text-muted"}>
                        {n}/{r.voters}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-line">
                      <div className="h-1.5 rounded-full bg-accent" style={{ width: `${(n / max) * 100}%` }} />
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

export function Feedback({ view, act }: { view: RoomView; act: Act }) {
  const { me, members } = view;
  const mine = members.find((m) => m.id === me.id);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-5">
      <Results view={view} />
      <section className="card space-y-3">
        <h2 className="font-bold">どの案も、決定に必要な承認に届きませんでした</h2>
        <p className="text-sm leading-relaxed text-muted">
          1回だけやり直します。「何が変われば承認できるか」を一言ください。AI
          が意見を取り込んで候補を改訂し、もう一度承認を取ります。2回目でも届かなければ、承認が最も多い案に決まります。
        </p>
        <Matrix view={view} ideaIds={view.room.shortlist} />
        {mine?.participant &&
          (mine.feedbackSent ? (
            <p className="text-sm font-semibold text-accent">送信しました。ほかの人を待っています。</p>
          ) : (
            <form
              className="space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await act.feedback(text);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <textarea
                className="input min-h-24"
                maxLength={400}
                placeholder="例：機能を1つに絞って、2日で作れる規模になるなら賛成"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <p className="hint">誰が書いたかは、ほかのメンバーにも AI にも伝わりません。</p>
              <button className="btn" disabled={busy}>
                {text.trim() ? "送る" : "特になしで送る"}
              </button>
            </form>
          ))}
        {me.isHost && (
          <button className="btn-ghost" onClick={() => act.host("close")}>
            今すぐ締め切って改訂に進む
          </button>
        )}
      </section>
    </div>
  );
}

export function Tie({ view, act }: { view: RoomView; act: Act }) {
  const { room, me } = view;
  return (
    <div className="space-y-5">
      <Results view={view} />
      <section className="card space-y-3">
        <h2 className="font-bold">最多の承認が同数になりました</h2>
        <p className="text-sm text-muted">
          この会議では、同数のときはホストが選ぶ設定です。選べるのは同数で並んだ案だけです。
        </p>
        <Matrix
          view={view}
          ideaIds={room.tieIds}
          extra={(id) =>
            me.isHost && (
              <button className="btn mt-2 px-3 py-1.5 text-xs" onClick={() => act.host("pick", id)}>
                この案に決める
              </button>
            )
          }
        />
        {!me.isHost && <p className="text-sm text-muted">ホストが選ぶのを待っています。</p>}
      </section>
    </div>
  );
}

const BY: Record<string, string> = {
  approval: "決定に必要な承認を集めた案です。",
  most: "2回とも必要な承認に届かなかったため、承認が最も多い案に決まりました。",
  manual: "最多の承認が同数だったため、ホストが選びました。",
  roulette: "最多の承認が同数だったため、ルーレットで決まりました。",
};

export function Decided({ view }: { view: RoomView }) {
  const { room, ideas } = view;
  const idea = ideas.find((i) => i.id === room.decidedIdeaId);
  const roulette = room.decidedBy === "roulette" && room.tieIds.length > 1;
  const [spinning, setSpinning] = useState(roulette);
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (!roulette) return;
    const target = room.tieIds.indexOf(room.decidedIdeaId ?? "");
    const total = room.tieIds.length * 5 + target;
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setCursor(i % room.tieIds.length);
      if (i >= total) return setSpinning(false);
      i++;
      t = setTimeout(tick, 60 + (i / total) ** 3 * 400);
    };
    t = setTimeout(tick, 0);
    return () => clearTimeout(t);
  }, [roulette, room.tieIds, room.decidedIdeaId]);

  return (
    <div className="space-y-5">
      {roulette && (
        <section className="card space-y-2">
          <p className="text-sm font-semibold">同数の案からルーレット</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {room.tieIds.map((id, i) => (
              <li
                key={id}
                className={`rounded-xl border-2 px-3 py-3 text-center text-sm font-semibold transition ${
                  i === cursor ? "border-accent bg-accent-soft" : "border-line"
                }`}
              >
                {ideas.find((x) => x.id === id)?.title}
              </li>
            ))}
          </ul>
        </section>
      )}
      {!spinning && idea && room.design === "fun" && <Confetti />}
      {!spinning && idea && (
        <section className="card cell-pop space-y-3 border-2 border-accent">
          <p className="text-sm font-semibold text-accent">{room.design === "fun" ? "決定！🎉" : "決定"}</p>
          <h2 className="text-2xl font-bold">{idea.title}</h2>
          {idea.author && <p className="text-sm text-muted">元の案：{idea.author}さん</p>}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{idea.body}</p>
          <p className="rounded-lg bg-bg px-3 py-2 text-sm">{BY[room.decidedBy ?? "approval"]}</p>
        </section>
      )}
      {!spinning && view.results.length > 0 && <Results view={view} />}
      {!spinning && room.shortlist.length > 0 && (
        <section className="card space-y-3">
          <h2 className="font-bold">最後の候補の照合表</h2>
          <Matrix view={view} ideaIds={room.shortlist} />
        </section>
      )}
    </div>
  );
}

const CONFETTI_COLORS = ["#ff5d3a", "#ffb000", "#14965a", "#3a86ff", "#ff4fa3", "#8338ec"];

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 70 }, (_, i) => ({
      left: Math.random() * 100,
      dx: `${(Math.random() - 0.5) * 220}px`,
      rot: `${(Math.random() - 0.5) * 1440}deg`,
      delay: Math.random() * 0.8,
      duration: 2.4 + Math.random() * 1.8,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    })),
  );
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i
          key={i}
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--dx": p.dx,
              "--rot": p.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
