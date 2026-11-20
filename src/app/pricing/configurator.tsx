"use client";

import { useState } from "react";
import { DEFAULT_SELECTION, PRESETS, PRICING_OPTIONS, choiceOf, totalPrice, type Selection } from "@/lib/pricing";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
const same = (a: Selection, b: Selection) => PRICING_OPTIONS.every((o) => a[o.id] === b[o.id]);

export function Configurator() {
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION);
  const total = totalPrice(selection);
  const upgrades = PRICING_OPTIONS.map((o) => ({ option: o, choice: choiceOf(o, selection) })).filter(
    (x) => x.choice.price > 0,
  );

  return (
    <div data-design="simple" className="min-h-screen">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="mb-6 rounded-xl border border-d/40 bg-d/10 px-4 py-2 text-sm">
          料金の試作ページです。開発中の環境でだけ表示され、購入はできません。金額はすべて仮です。
        </p>
        <header className="mb-8">
          <p className="text-sm font-semibold text-accent">Temora</p>
          <h1 className="mt-1 text-2xl font-bold">会議ごとに、必要な分だけ</h1>
          <p className="mt-2 text-sm text-muted">
            標準のままなら無料です。会議を作るときに、必要な項目だけ上げられます。
          </p>
        </header>

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
              {PRICING_OPTIONS.map((o) => {
                const c = choiceOf(o, selection);
                return (
                  <li key={o.id} className="flex justify-between gap-2">
                    <span className="text-muted">{o.label}</span>
                    <span>{c.label}</span>
                  </li>
                );
              })}
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
      </main>
    </div>
  );
}
