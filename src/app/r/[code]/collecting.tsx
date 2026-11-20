"use client";

import { useState } from "react";
import { errorText } from "@/lib/client";
import type { Act, RoomView } from "./room";

type Draft = { id?: string; title: string; body: string };
const EMPTY: Draft = { title: "", body: "" };

export function Collecting({ view, act }: { view: RoomView; act: Act }) {
  const { me, room, ideas } = view;
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [must, setMust] = useState<string[]>(() => [...me.mustHaves, "", ""].slice(0, 2));
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const mustSaved = JSON.stringify(me.mustHaves) === JSON.stringify(must.map((s) => s.trim()).filter(Boolean));

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-5">
      <section className="card space-y-4">
        <div>
          <h2 className="font-bold">あなたの案</h2>
          <p className="hint mt-1">ほかの人の案は、締切のあとに見えます。誰の案かは決定まで伏せられます。</p>
        </div>

        {ideas.length > 0 && (
          <ul className="space-y-2">
            {ideas.map((i) => (
              <li key={i.id} className="rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{i.title}</p>
                  <div className="flex shrink-0 gap-1">
                    <button
                      className="btn-ghost px-2.5 py-1 text-xs"
                      onClick={() => setDraft({ id: i.id, title: i.title, body: i.body })}
                    >
                      直す
                    </button>
                    <button
                      className="btn-ghost px-2.5 py-1 text-xs"
                      disabled={!!busy}
                      onClick={() => run("del", () => act.deleteIdea(i.id))}
                    >
                      消す
                    </button>
                  </div>
                </div>
                {i.body && <p className="mt-1 text-sm whitespace-pre-wrap text-muted">{i.body}</p>}
              </li>
            ))}
          </ul>
        )}

        <form
          className="space-y-3 rounded-xl bg-bg p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run("save", async () => {
              await act.saveIdea(draft);
              setDraft(EMPTY);
            });
          }}
        >
          <p className="text-sm font-semibold">
            {draft.id ? "案を直す" : ideas.length ? "別の案を追加する" : "案を出す"}
          </p>
          <input
            className="input bg-card"
            aria-label="案の名前"
            placeholder="案の名前（例：学食の混雑予報）"
            maxLength={40}
            required
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <textarea
            className="input min-h-28 bg-card"
            aria-label="案の説明"
            placeholder="何を作る？誰のため？どう作る？不安な点は？ メモ書きでも大丈夫です。"
            maxLength={1200}
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn" disabled={!!busy || !draft.title.trim()}>
              {busy === "save" ? "保存中…" : draft.id ? "直した内容で保存" : "この案を出す"}
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={!!busy || !draft.body.trim() || me.assistLeft === 0}
              onClick={() =>
                run("assist", async () => {
                  const res = await act.assist(draft.body);
                  setDraft({ ...draft, title: draft.title || res.title, body: res.body });
                })
              }
            >
              {busy === "assist" ? "AIが整えています…" : `AIで型にそろえる（残り${me.assistLeft}回）`}
            </button>
            {draft.id && (
              <button type="button" className="text-sm text-muted underline" onClick={() => setDraft(EMPTY)}>
                やめる
              </button>
            )}
          </div>
          <p className="hint">
            AIで型にそろえると、全員の案が同じ書き方になり、書いた量の差で有利・不利が出にくくなります。結果は保存前に直せます。
          </p>
        </form>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="font-bold">判断軸</h2>
          <p className="hint mt-1">
            すべての案を、下の軸ごとに AI が ○（満たす）△（一部・不明）✕（満たさない）で照らします。
          </p>
        </div>
        {room.teamAxes.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted">チーム共通</p>
            <ul className="flex flex-wrap gap-1.5">
              {room.teamAxes.map((a) => (
                <li key={a} className="rounded-full bg-accent-soft px-3 py-1 text-sm">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            run("must", () => act.updateMe({ mustHaves: must.map((s) => s.trim()).filter(Boolean) }));
          }}
        >
          <p className="text-xs font-semibold text-muted">あなたの譲れない条件（最大2つ・任意）</p>
          {must.map((v, i) => (
            <input
              key={i}
              className="input"
              maxLength={40}
              placeholder={i === 0 ? "例：スマホで使える" : "2つ目（任意）"}
              value={v}
              onChange={(e) => setMust(must.map((x, j) => (j === i ? e.target.value : x)))}
            />
          ))}
          <p className="hint">ここで ✕ になった案は、候補から外れます。本当に譲れないものだけにしてください。</p>
          <button className="btn-ghost" disabled={!!busy || mustSaved}>
            {mustSaved ? "保存済み" : "条件を保存"}
          </button>
        </form>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          {me.ready ? (
            <p className="font-semibold text-accent">
              提出済みです。全員がそろうか、締切になると AI の照合が始まります。
            </p>
          ) : (
            <p>案と条件を出し終えたら、提出してください。</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className={me.ready ? "btn-ghost" : "btn"}
            disabled={!!busy || (!me.ready && ideas.length === 0 && !mustSaved)}
            onClick={() => run("ready", () => act.updateMe({ ready: !me.ready }))}
          >
            {me.ready ? "提出を取り消す" : "提出する"}
          </button>
          {me.isHost && (
            <button className="btn-ghost" disabled={!!busy} onClick={() => run("close", () => act.host("close"))}>
              今すぐ締め切る
            </button>
          )}
        </div>
      </section>
      {error && <p className="text-sm text-x">{error}</p>}
    </div>
  );
}
