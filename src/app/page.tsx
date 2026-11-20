"use client";

import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useSignInWithGoogle } from "@convex-dev/auth/methods/google/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { errorText, saveSession } from "@/lib/client";
import { DEFAULT_DESIGN, DESIGNS, type Design } from "@/lib/designs";
import { formatDateTime, nextHour, toLocalInput } from "@/lib/time";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [joinCode, setJoinCode] = useState("");
  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN);

  return (
    <div data-design={design} className="min-h-screen">
      <main className="mx-auto max-w-xl px-4 py-10">
        <header className="mb-8">
          <p className="text-sm font-semibold text-accent">
            Temora <span className="font-normal text-muted">テモラ</span>
          </p>
          <h1 className="mt-1 text-2xl leading-snug font-bold">アイデアを持ち寄って、みんなでテーマを決める。</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            各自が案と「譲れない条件」を出すと、AI が全案を同じ基準で ○△✕ に照らします。AI
            は推薦しません。候補を最大3つに絞り、どれにするかは全員の承認で決めます。集まれなくても、締切がくれば自動で進みます。
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
              className="input font-mono tracking-widest uppercase"
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

        {!isAuthenticated ? <SignInCard loading={isLoading} /> : <CreateForm design={design} onDesign={setDesign} />}
      </main>
    </div>
  );
}

const SWATCH: Record<
  Design,
  {
    bg: string;
    card: string;
    line: string;
    fg: string;
    accent: string;
    btnFg: string;
    o: string;
    d: string;
    x: string;
    radius: number;
    shadow?: string;
    font?: string;
  }
> = {
  simple: {
    bg: "#f6f5f1",
    card: "#ffffff",
    line: "#e3e0d8",
    fg: "#1d1c1a",
    accent: "#2f5d50",
    btnFg: "#ffffff",
    o: "#2f7d4f",
    d: "#b0821c",
    x: "#b8433a",
    radius: 10,
  },
  fun: {
    bg: "#fff6e0",
    card: "#ffffff",
    line: "#2b2118",
    fg: "#2b2118",
    accent: "#ff5d3a",
    btnFg: "#ffffff",
    o: "#14965a",
    d: "#e39b00",
    x: "#e5383b",
    radius: 14,
    shadow: "3px 3px 0 #2b2118",
    font: "var(--font-maru)",
  },
  calm: {
    bg: "#f3efe6",
    card: "#fbf9f4",
    line: "#ddd5c6",
    fg: "#2a2724",
    accent: "#34477a",
    btnFg: "#ffffff",
    o: "#3d6b4f",
    d: "#9a7a2e",
    x: "#9b3d36",
    radius: 5,
    font: "var(--font-mincho)",
  },
  cool: {
    bg: "#0b1018",
    card: "#121a26",
    line: "#233044",
    fg: "#e6edf5",
    accent: "#2dd4bf",
    btnFg: "#06201d",
    o: "#34d399",
    d: "#fbbf24",
    x: "#fb7185",
    radius: 10,
    shadow: "0 0 10px rgba(45,212,191,.35)",
  },
};

function DesignSwatch({ design }: { design: Design }) {
  const t = SWATCH[design];
  return (
    <span
      aria-hidden
      className="block rounded-lg p-2"
      style={{
        background: t.bg,
        border: `1px solid ${t.line}`,
        fontFamily: t.font,
      }}
    >
      <span
        className="block p-2"
        style={{
          background: t.card,
          border: `${design === "fun" ? 2 : 1}px solid ${t.line}`,
          borderRadius: t.radius,
          boxShadow: design === "fun" ? t.shadow : undefined,
        }}
      >
        <span className="block h-1.5 w-10 rounded-full" style={{ background: t.fg, opacity: 0.7 }} />
        <span className="mt-1.5 flex items-center gap-1.5 text-sm leading-none font-bold">
          <span style={{ color: t.o }}>○</span>
          <span style={{ color: t.d }}>△</span>
          <span style={{ color: t.x }}>✕</span>
          <span
            className="ml-auto px-2 py-0.5 text-[10px]"
            style={{
              background: t.accent,
              color: t.btnFg,
              borderRadius: design === "fun" ? 999 : t.radius / 2,
              boxShadow: design === "cool" ? t.shadow : undefined,
            }}
          >
            承認
          </span>
        </span>
      </span>
    </span>
  );
}

function CreateForm({ design, onDesign }: { design: Design; onDesign: (d: Design) => void }) {
  const router = useRouter();
  const createRoom = useMutation(api.rooms.create);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [minAt] = useState(() => toLocalInput(Date.now()));
  const [form, setForm] = useState(() => ({
    hostName: "",
    title: "",
    theme: "",
    axes: "スマホで動く\n期限までに作れる",
    tieMode: "roulette" as "roulette" | "manual",
    collectAt: toLocalInput(nextHour(Date.now(), 24)),
    voteHours: 24,
  }));
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { collectAt, ...rest } = form;
      const res = await createRoom({
        ...rest,
        design,
        collectDeadline: new Date(collectAt).getTime(),
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
    <form className="card space-y-5" onSubmit={create}>
      <h2 className="font-bold">ホストとして会議を作る</h2>
      <Account />
      <div>
        <label className="label" htmlFor="f3">
          あなたの名前
        </label>
        <input
          id="f3"
          className="input"
          required
          maxLength={30}
          value={form.hostName}
          onChange={(e) => set("hostName", e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="f1">
          何を決める？
        </label>
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
        <label className="label" htmlFor="f2">
          お題・前提（任意）
        </label>
        <textarea
          id="f2"
          className="input min-h-20"
          maxLength={400}
          placeholder="例：テーマは「かゆいところに手が届くアプリ」。開発期間は2日。"
          value={form.theme}
          onChange={(e) => set("theme", e.target.value)}
        />
      </div>
      <fieldset>
        <legend className="label">ページのデザイン</legend>
        <div className="grid grid-cols-2 gap-2">
          {DESIGNS.map((d) => (
            <label
              key={d.id}
              className={`cursor-pointer rounded-xl border-2 p-2 text-sm transition ${design === d.id ? "border-accent" : "border-transparent"}`}
            >
              <input
                type="radio"
                name="design"
                className="sr-only"
                checked={design === d.id}
                onChange={() => onDesign(d.id)}
              />
              <DesignSwatch design={d.id} />
              <span className="mt-1.5 block font-semibold">
                {d.label}
                {d.id === DEFAULT_DESIGN && <span className="ml-1 text-xs font-normal text-muted">（標準）</span>}
              </span>
              <span className="hint block leading-snug">{d.desc}</span>
            </label>
          ))}
        </div>
        <p className="hint mt-1.5">参加者全員の画面がこのデザインになります。選ぶとこのページで試せます。</p>
      </fieldset>
      <div>
        <label className="label" htmlFor="f4">
          チーム共通の判断軸（1行に1つ、最大6つ）
        </label>
        <textarea id="f4" className="input min-h-24" value={form.axes} onChange={(e) => set("axes", e.target.value)} />
        <p className="hint mt-1">各メンバーの「譲れない条件」は、参加したあとにそれぞれが追加します。</p>
      </div>
      <div>
        <label className="label" htmlFor="f5">
          案の締切
        </label>
        <input
          id="f5"
          type="datetime-local"
          className="input"
          required
          min={minAt}
          value={form.collectAt}
          onChange={(e) => set("collectAt", e.target.value)}
        />
        <p className="hint mt-1">この日時までに各自が案を出します。全員が提出すれば、締切前でも次に進みます。</p>
      </div>
      <div>
        <label className="label" htmlFor="f6">
          承認を受け付ける時間
        </label>
        <select
          id="f6"
          className="input"
          value={form.voteHours}
          onChange={(e) => set("voteHours", Number(e.target.value))}
        >
          {[3, 12, 24, 48, 72].map((h) => (
            <option key={h} value={h}>
              候補が出てから {h < 24 ? `${h}時間` : `${h / 24}日`}
            </option>
          ))}
        </select>
        <p className="hint mt-1">
          AI が候補を出したあと、全員が「これならいい」を付けるまでの時間です。全員が付ければ早く終わります。
          {Number.isFinite(new Date(form.collectAt).getTime()) && (
            <>
              {" "}
              目安：案の締切 {formatDateTime(new Date(form.collectAt).getTime())} → 承認の締切{" "}
              {formatDateTime(new Date(form.collectAt).getTime() + form.voteHours * 3_600_000)} ごろ
            </>
          )}
        </p>
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
  );
}

function SignInCard({ loading }: { loading: boolean }) {
  const { signIn } = useSignInWithGoogle(api.auth);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="card space-y-3">
      <h2 className="font-bold">ホストとして会議を作る</h2>
      <p className="text-sm leading-relaxed text-muted">
        会議を作るにはログインが必要です（AI の利用量を管理するため）。招待された人は、ログインしなくても参加できます。
      </p>
      <button
        className="btn w-full"
        disabled={loading || busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const res = await signIn();
            if (res && "error" in res && res.error) {
              setError("ログインを始められませんでした。少し待ってからもう一度試してください");
              setBusy(false);
            }
          } catch (e) {
            setError(errorText(e));
            setBusy(false);
          }
        }}
      >
        {loading ? "確認中…" : busy ? "Google に移動しています…" : "Google でログイン"}
      </button>
      {error && <p className="text-sm text-x">{error}</p>}
    </section>
  );
}

function Account() {
  const me = useQuery(api.users.me);
  const quota = useQuery(api.rooms.myQuota);
  const { signOut } = useAuthActions();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-bg px-3 py-2 text-xs">
      <span>
        {me?.name ?? "ログイン中"}
        {quota && (
          <span className="ml-2 text-muted">
            {quota.plan}プラン・今日作れる会議 あと{Math.max(0, quota.limit - quota.used)}/{quota.limit}
          </span>
        )}
      </span>
      <button type="button" className="text-muted underline" onClick={() => signOut()}>
        ログアウト
      </button>
    </div>
  );
}
