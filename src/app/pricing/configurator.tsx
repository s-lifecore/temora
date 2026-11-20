"use client";

import { useState } from "react";
import {
  DEFAULT_SELECTION,
  ORG_PLANS,
  PERSONAL_MEMBER_LIMIT,
  PRESETS,
  PRICING_OPTIONS,
  choiceOf,
  totalPrice,
  type Selection,
} from "@/lib/pricing";
import { ThemeDecor, ThemeDecorPeek } from "../theme-decor";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
const same = (a: Selection, b: Selection) => PRICING_OPTIONS.every((o) => a[o.id] === b[o.id]);

type Tab = "personal" | "org";

export function Configurator() {
  const [tab, setTab] = useState<Tab>("personal");

  return (
    <div data-design="simple" className="min-h-screen">
      <ThemeDecor design="simple" />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <ThemeDecorPeek design="simple" className="-mb-6" />
        <p className="mb-6 rounded-xl border border-d/40 bg-d/10 px-4 py-2 text-sm">
          料金の試作ページです。開発中の環境でだけ表示され、購入はできません。金額はすべて仮です。
        </p>
        <header className="mb-6">
          <p className="text-sm font-semibold text-accent">Temora</p>
          <h1 className="mt-1 text-2xl font-bold">料金</h1>
          <p className="mt-2 text-sm text-muted">標準のままなら、ずっと無料で使えます。</p>
        </header>

        <div
          role="tablist"
          aria-label="プランの種類"
          className="mb-8 inline-flex rounded-xl border border-line bg-card p-1"
        >
          {(
            [
              ["personal", "個人"],
              ["org", "法人・団体"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${tab === id ? "bg-accent text-card" : "text-muted hover:text-fg"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "personal" ? <Personal /> : <Org />}

        <section className="card mt-10 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Temora は無料で使えます。気に入ったら、開発と運営を応援してもらえるとうれしいです。
          </p>
          <span className="btn-ghost pointer-events-none shrink-0 opacity-60">応援する（見本）</span>
        </section>
        <p className="hint mt-2">
          応援ボタンの見本です。実際のボタンは、環境変数 NEXT_PUBLIC_SUPPORT_URL
          を設定するとトップページと決定の画面に表示されます。
        </p>
      </main>
    </div>
  );
}

function Personal() {
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION);
  const total = totalPrice(selection);
  const upgrades = PRICING_OPTIONS.map((o) => ({ option: o, choice: choiceOf(o, selection) })).filter(
    (x) => x.choice.price > 0,
  );

  return (
    <>
      <p className="mb-6 text-sm text-muted">
        チームやゼミで、会議ごとに必要な分だけ。参加は{PERSONAL_MEMBER_LIMIT}
        人まで（ハッカソンのチームなら十分です）。会議を作るときに、必要な項目だけ上げられます。
      </p>

      <section className="mb-8">
        <h2 className="mb-3 font-bold">おすすめの構成</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {PRESETS.map((p) => {
            const active = same(selection, p.selection);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelection(p.selection)}
                className={`card text-left transition ${active ? "border-accent ring-2 ring-accent" : "hover:border-accent"}`}
              >
                <span className="block font-bold">{p.label}</span>
                <span className="hint block">{p.detail}</span>
                <span className="mt-2 block text-xl font-bold">
                  {totalPrice(p.selection) === 0 ? "無料" : yen(totalPrice(p.selection))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
        <section className="space-y-6">
          <h2 className="font-bold">項目ごとに選ぶ</h2>
          {PRICING_OPTIONS.map((option) => (
            <fieldset key={option.id} className="space-y-2">
              <legend className="label">{option.label}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {option.choices.map((choice) => {
                  const checked = selection[option.id] === choice.id;
                  return (
                    <label
                      key={choice.id}
                      className={`cursor-pointer rounded-xl border-2 bg-card p-3 text-sm transition ${checked ? "border-accent" : "border-line hover:border-accent/50"}`}
                    >
                      <input
                        type="radio"
                        name={option.id}
                        className="sr-only"
                        checked={checked}
                        onChange={() => setSelection({ ...selection, [option.id]: choice.id })}
                      />
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold">{choice.label}</span>
                        <span className={choice.price ? "text-accent" : "text-muted"}>
                          {choice.price ? `+${yen(choice.price)}` : "標準"}
                        </span>
                      </span>
                      {choice.detail && <span className="hint mt-0.5 block">{choice.detail}</span>}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </section>

        <aside className="card space-y-4 lg:sticky lg:top-6">
          <h2 className="font-bold">この会議の構成</h2>
          <ul className="space-y-1.5 text-sm">
            <li className="flex justify-between gap-2">
              <span className="text-muted">参加人数</span>
              <span>{PERSONAL_MEMBER_LIMIT}人まで</span>
            </li>
            {PRICING_OPTIONS.map((o) => (
              <li key={o.id} className="flex justify-between gap-2">
                <span className="text-muted">{o.label}</span>
                <span>{choiceOf(o, selection).label}</span>
              </li>
            ))}
          </ul>
          {upgrades.length > 0 && (
            <ul className="space-y-1 border-t border-line pt-3 text-sm">
              {upgrades.map(({ option, choice }) => (
                <li key={option.id} className="flex justify-between gap-2">
                  <span>{choice.label}</span>
                  <span>+{yen(choice.price)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <span className="font-semibold">合計（税込）</span>
            <span className="text-2xl font-bold">{total === 0 ? "無料" : yen(total)}</span>
          </div>
          <button type="button" className="btn w-full" disabled>
            {total === 0 ? "この構成で会議を作る" : `${yen(total)} で会議を作る`}
          </button>
          <p className="hint">試作のため、ボタンは押せません。</p>
          <button
            type="button"
            className="w-full text-sm text-muted underline"
            onClick={() => setSelection(DEFAULT_SELECTION)}
          >
            標準に戻す
          </button>
        </aside>
      </div>
    </>
  );
}

function Org() {
  return (
    <>
      <p className="mb-6 text-sm text-muted">
        ハッカソンや勉強会の運営、サークル、ゼミ、授業、企業向け。参加チームの数だけ会議を用意し、各チームの代表に進行を任せられます。
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {ORG_PLANS.map((plan) => (
          <section key={plan.id} className="card flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold">{plan.label}</h2>
              <p className="mt-1 text-sm text-muted">{plan.summary}</p>
            </div>
            <p className="text-3xl font-bold">
              {plan.price === null ? (
                <span className="text-xl">ご相談</span>
              ) : (
                <>
                  {yen(plan.price)}
                  <span className="ml-1 text-sm font-normal text-muted">/ {plan.unit}（税込）</span>
                </>
              )}
            </p>
            <ul className="flex-1 space-y-1.5 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-o">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button type="button" className={plan.purchase === "checkout" ? "btn w-full" : "btn-ghost w-full"} disabled>
              {plan.purchase === "checkout" ? "カードで購入する" : "相談する"}
            </button>
          </section>
        ))}
      </div>
      <p className="hint mt-3">
        「イベント」と「年額」はその場でカード払い、「大規模・特別対応」は内容を相談して決めます。試作のため、ボタンは押せません。
      </p>
    </>
  );
}
