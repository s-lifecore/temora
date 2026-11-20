"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { errorText, saveSession } from "@/lib/client";

export default function Home() {
  const router = useRouter();
  const createRoom = useMutation(api.rooms.create);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [form, setForm] = useState({
    hostName: "",
    title: "",
    theme: "",
    axes: "スマホで動く\n期限までに作れる",
    tieMode: "roulette" as "roulette" | "manual",
    collectHours: 24,
    voteHours: 24,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await createRoom({
          ...form,
          axes: form.axes
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
      });
      saveSession(res.code, { memberId: res.memberId, token: res.token });
      router.push(`/r/${res.code}`);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-semibold text-accent">
          Temora <span className="font-normal text-muted">テモラ</span>
        </p>
        <h1 className="mt-1 text-2xl font-bold leading-snug">アイデアを持ち寄って、みんなでテーマを決める。</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          各自が案と「譲れない条件」を出すと、AI が全案を同じ基準で ○△✕ に照らします。AI は推薦しません。候補を最大3つに絞り、どれにするかは全員の承認で決めます。集まれなくても、締切がくれば自動で進みます。
        </p>
      </header>

      <section className="card mb-6">
        <h2 className="mb-3 font-bold">招待された会議に入る</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (joinCode.trim()) router.push(`/r/${joinCode.trim().toUpperCase()}`);
          }}
        >
          <input
            className="input font-mono uppercase tracking-widest"
            placeholder="会議コード（8文字）"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            maxLength={8}
          />
          <button className="btn shrink-0" disabled={joinCode.trim().length !== 8}>
            入る
          </button>
        </form>
      </section>

      <form className="card space-y-5" onSubmit={create}>
        <h2 className="font-bold">ホストとして会議を作る</h2>
        <div>
          <label className="label" htmlFor="f3">あなたの名前</label>
          <input id="f3" className="input" required maxLength={30} value={form.hostName} onChange={(e) => set("hostName", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="f1">何を決める？</label>
          <input
            id="f1"
            className="input"
            required
            maxLength={60}
            placeholder="例：ハッカソンで作るもの"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="f2">お題・前提（任意）</label>
          <textarea
            id="f2"
            className="input min-h-20"
            maxLength={400}
            placeholder="例：テーマは「かゆいところに手が届くアプリ」。開発期間は2日。"
            value={form.theme}
            onChange={(e) => set("theme", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="f4">チーム共通の判断軸（1行に1つ、最大6つ）</label>
          <textarea id="f4" className="input min-h-24" value={form.axes} onChange={(e) => set("axes", e.target.value)} />
          <p className="hint mt-1">各メンバーの「譲れない条件」は、参加したあとにそれぞれが追加します。</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="f5">案の締切</label>
            <select id="f5" className="input" value={form.collectHours} onChange={(e) => set("collectHours", Number(e.target.value))}>
              {[3, 12, 24, 48, 72, 168].map((h) => (
                <option key={h} value={h}>
                  {h < 24 ? `${h}時間後` : `${h / 24}日後`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f6">承認の期間</label>
            <select id="f6" className="input" value={form.voteHours} onChange={(e) => set("voteHours", Number(e.target.value))}>
              {[3, 12, 24, 48, 72].map((h) => (
                <option key={h} value={h}>
                  {h < 24 ? `${h}時間` : `${h / 24}日`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <fieldset>
          <legend className="label">最多票が同数になったら</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["roulette", "ルーレットで決める", "同数の案から公平にランダムで選ぶ"],
                ["manual", "ホストが決める", "同数の案の中からホストが選ぶ"],
              ] as const
            ).map(([v, label, desc]) => (
              <label
                key={v}
                className={`cursor-pointer rounded-xl border p-3 text-sm ${form.tieMode === v ? "border-accent bg-accent-soft" : "border-line"}`}
              >
                <input type="radio" className="sr-only" checked={form.tieMode === v} onChange={() => set("tieMode", v)} />
                <span className="font-semibold">{label}</span>
                <span className="hint mt-0.5 block">{desc}</span>
              </label>
            ))}
          </div>
          <p className="hint mt-1.5">結果を見てから選べないように、ここで先に決めておきます。</p>
        </fieldset>
        {error && <p className="text-sm text-x">{error}</p>}
        <button className="btn w-full" disabled={busy}>
          {busy ? "作成中…" : "会議を作る"}
        </button>
      </form>
    </main>
  );
}
