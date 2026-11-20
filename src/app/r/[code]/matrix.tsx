"use client";

import { useState } from "react";
import type { RoomView } from "./room";

const SYMBOL = { o: "○", d: "△", x: "✕" } as const;
const COLOR = { o: "text-o", d: "text-d", x: "text-x" } as const;

export function Matrix({
  view,
  ideaIds,
  extra,
}: {
  view: RoomView;
  ideaIds: string[];
  extra?: (ideaId: string) => React.ReactNode;
}) {
  const { axes, marks, ideas } = view;
  const [open, setOpen] = useState<string | null>(null);
  const markOf = (ideaId: string, axisId: string) => marks.find((m) => m.ideaId === ideaId && m.axisId === axisId);

  return (
    <div className="space-y-3">
      <ul className="space-y-3 sm:hidden">
        {ideaIds.map((id) => {
          const idea = ideas.find((i) => i.id === id);
          if (!idea) return null;
          return (
            <li key={id} className="rounded-xl border border-line p-3">
              <button className="text-left" onClick={() => setOpen(open === id ? null : id)}>
                <span className="font-semibold">{idea.title}</span>
                {idea.mine && <span className="ml-1.5 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent">あなたの案</span>}
                {idea.parentId && <span className="ml-1.5 rounded bg-d/15 px-1.5 py-0.5 text-[10px] text-d">改訂版</span>}
                {idea.summary && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{idea.summary}</span>}
              </button>
              <ul className="mt-2 grid grid-cols-2 gap-1.5">
                {axes.map((a) => {
                  const m = markOf(id, a.id);
                  return (
                    <li key={a.id} className="flex items-center gap-2 rounded-lg bg-bg px-2 py-1.5 text-xs">
                      <span className={`w-4 text-center text-base font-bold ${m ? COLOR[m.mark] : "text-muted"}`}>{m ? SYMBOL[m.mark] : "-"}</span>
                      <span className={`min-w-0 leading-tight ${a.kind === "must" ? "text-accent" : ""}`}>
                        {a.label}
                        {a.ownerName && <span className="block text-[10px] text-muted">{a.ownerName}の条件</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {extra?.(id)}
            </li>
          );
        })}
      </ul>
      <div className="-mx-5 hidden overflow-x-auto px-5 sm:block">
        <table className="w-full min-w-[520px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="w-[40%] border-b border-line pb-2 text-left text-xs font-semibold text-muted">案</th>
              {axes.map((a) => (
                <th key={a.id} className="border-b border-line px-1 pb-2 text-center align-bottom text-xs font-semibold">
                  <span className={a.kind === "must" ? "text-accent" : ""}>{a.label}</span>
                  {a.ownerName && <span className="block font-normal text-muted">{a.ownerName}の条件</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ideaIds.map((id, row) => {
              const idea = ideas.find((i) => i.id === id);
              if (!idea) return null;
              return (
                <tr key={id} className="align-top">
                  <td className="border-b border-line py-3 pr-3">
                    <button className="text-left" onClick={() => setOpen(open === id ? null : id)}>
                      <span className="font-semibold">{idea.title}</span>
                      {idea.mine && <span className="ml-1.5 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent">あなたの案</span>}
                      {idea.parentId && <span className="ml-1.5 rounded bg-d/15 px-1.5 py-0.5 text-[10px] text-d">改訂版</span>}
                      {idea.summary && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{idea.summary}</span>}
                    </button>
                    {extra?.(id)}
                  </td>
                  {axes.map((a, col) => {
                    const m = markOf(id, a.id);
                    return (
                      <td key={a.id} className="border-b border-line px-1 py-3 text-center">
                        {m ? (
                          <button
                            title={m.reason}
                            onClick={() => setOpen(open === id ? null : id)}
                            className={`cell-pop text-xl font-bold ${COLOR[m.mark]}`}
                            style={{ animationDelay: `${(row * axes.length + col) * 60}ms` }}
                          >
                            {SYMBOL[m.mark]}
                          </button>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {open && <Detail view={view} ideaId={open} onClose={() => setOpen(null)} />}
      <p className="hint">記号か案の名前を押すと、AI がそう判断した理由と、案の全文が見られます。</p>
    </div>
  );
}

function Detail({ view, ideaId, onClose }: { view: RoomView; ideaId: string; onClose: () => void }) {
  const idea = view.ideas.find((i) => i.id === ideaId);
  const parent = idea?.parentId ? view.ideas.find((i) => i.id === idea.parentId) : null;
  if (!idea) return null;
  return (
    <div className="rounded-xl border border-accent bg-accent-soft/40 p-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold">{idea.title}</p>
        <button className="text-xs text-muted underline" onClick={onClose}>
          閉じる
        </button>
      </div>
      <p className="mt-2 whitespace-pre-wrap leading-relaxed">{idea.body || "（説明なし）"}</p>
      {parent && <p className="hint mt-2">元の案：{parent.title}</p>}
      <ul className="mt-3 space-y-1">
        {view.axes.map((a) => {
          const m = view.marks.find((x) => x.ideaId === ideaId && x.axisId === a.id);
          if (!m) return null;
          return (
            <li key={a.id} className="flex gap-2">
              <span className={`w-5 shrink-0 text-center font-bold ${COLOR[m.mark]}`}>{SYMBOL[m.mark]}</span>
              <span>
                <span className="font-semibold">{a.label}</span>：{m.reason}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
