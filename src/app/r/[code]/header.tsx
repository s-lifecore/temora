"use client";

import { useEffect, useState } from "react";
import { STEP_ICONS } from "@/lib/designs";
import { formatDateTime } from "@/lib/time";
import type { RoomView } from "./room";

const STEPS = [
  { key: "collect", label: "案を出す" },
  { key: "judge", label: "AIが照合" },
  { key: "vote", label: "承認" },
  { key: "decided", label: "決定" },
] as const;

function stepOf(phase: RoomView["room"]["phase"]): number {
  if (phase === "collecting") return 0;
  if (phase === "judging" || phase === "revising") return 1;
  if (phase === "voting" || phase === "feedback" || phase === "tie") return 2;
  return 3;
}

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

const DEADLINE_LABEL: Partial<Record<RoomView["room"]["phase"], string>> = {
  collecting: "案の締切",
  voting: "承認の締切",
  feedback: "意見の締切",
};

export function remaining(deadline: number | null, now: number): string {
  if (!deadline) return "";
  const diff = deadline - now;
  if (diff <= 0) return "締切を過ぎました";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h >= 24 ? `あと${Math.floor(h / 24)}日${h % 24}時間` : h > 0 ? `あと${h}時間${m}分` : `あと${m}分`;
}

export function Header({ view }: { view: RoomView }) {
  const { room, members, me } = view;
  const now = useNow();
  const [copied, setCopied] = useState(false);
  const step = stepOf(room.phase);
  const deadline = room.phase === "collecting" ? room.collectDeadline : room.phaseDeadline;

  return (
    <header className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl leading-snug font-bold">{room.title}</h1>
          {room.theme && <p className="mt-1 text-sm whitespace-pre-wrap text-muted">{room.theme}</p>}
        </div>
        {room.phase === "collecting" && (
          <button
            className="btn-ghost shrink-0 text-xs"
            onClick={async () => {
              const url = `${location.origin}/r/${room.code}`;
              try {
                await navigator.clipboard.writeText(`「${room.title}」を決める会議に参加してください\n${url}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {}
            }}
          >
            {copied ? "コピーしました" : `招待リンクをコピー（${room.code}）`}
          </button>
        )}
      </div>

      <ol className="grid grid-cols-4 gap-1 text-center text-xs">
        {STEPS.map((s, i) => (
          <li key={s.key}>
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-accent" : "bg-accent-soft"}`} />
            <span className={`mt-1.5 block ${i === step ? "font-bold text-fg" : "text-muted"}`}>
              {STEP_ICONS[room.design]?.[i] && <span className="mr-0.5">{STEP_ICONS[room.design]![i]}</span>}
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        {room.round > 1 && room.phase !== "decided" && <span className="font-semibold text-d">2回目（やり直し）</span>}
        {deadline && DEADLINE_LABEL[room.phase] && (
          <span>
            {DEADLINE_LABEL[room.phase]} {formatDateTime(deadline)}（{remaining(deadline, now)}）
          </span>
        )}
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {members.map((m) => {
          const done =
            room.phase === "collecting"
              ? m.ready
              : room.phase === "voting"
                ? m.voted
                : room.phase === "feedback"
                  ? m.feedbackSent
                  : false;
          const active = room.phase === "collecting" || m.participant;
          return (
            <li
              key={m.id}
              className={`rounded-full border px-2.5 py-1 text-xs ${done ? "border-accent bg-accent-soft" : "border-line"} ${active ? "" : "opacity-40"}`}
            >
              {m.name}
              {m.id === me.id && "（あなた）"}
              {m.isHost && " ★"}
              {done && " ✓"}
            </li>
          );
        })}
      </ul>
    </header>
  );
}
