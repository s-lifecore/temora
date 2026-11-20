"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useMemo, useState, useSyncExternalStore } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { errorText, parseSession, readSessionRaw, saveSession, subscribeSession, type Session } from "@/lib/client";
import { Collecting } from "./collecting";
import { Header } from "./header";
import { Decided, Feedback, Tie, Working } from "./phases";
import { Voting } from "./voting";

export type RoomView = FunctionReturnType<typeof api.rooms.view>;

export type Act = ReturnType<typeof useAct>;

function useAct(code: string, token: string) {
  const s = { code, token };
  const saveIdea = useMutation(api.rooms.saveIdea);
  const deleteIdea = useMutation(api.rooms.deleteIdea);
  const updateMe = useMutation(api.rooms.updateMe);
  const vote = useMutation(api.rooms.vote);
  const sendFeedback = useMutation(api.rooms.sendFeedback);
  const host = useMutation(api.rooms.host);
  const assist = useAction(api.ai.assist);
  return {
    saveIdea: (d: { id?: string; title: string; body: string }) =>
      saveIdea({ ...s, id: d.id as Id<"ideas"> | undefined, title: d.title, body: d.body }),
    deleteIdea: (id: string) => deleteIdea({ ...s, id: id as Id<"ideas"> }),
    updateMe: (p: { mustHaves?: string[]; ready?: boolean }) => updateMe({ ...s, ...p }),
    vote: (approved: string[]) => vote({ ...s, approved: approved as Id<"ideas">[] }),
    feedback: (text: string) => sendFeedback({ ...s, text }),
    host: (action: "close" | "retry" | "pick", ideaId?: string) => host({ ...s, action, ideaId: ideaId as Id<"ideas"> | undefined }),
    assist: (text: string) => assist({ ...s, text }),
  };
}

export function Room({ code }: { code: string }) {
  const raw = useSyncExternalStore(
    subscribeSession,
    () => readSessionRaw(code),
    () => undefined,
  );
  const session = useMemo(() => (raw === undefined ? undefined : parseSession(raw)), [raw]);

  if (session === undefined) return null;
  if (!session) return <Join code={code} onJoined={(s) => saveSession(code, s)} />;
  return <Joined code={code} session={session} />;
}

function Joined({ code, session }: { code: string; session: Session }) {
  const view = useQuery(api.rooms.view, { code, token: session.token });
  const act = useAct(code, session.token);

  if (!view) return <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted">読み込み中…</main>;

  const p = view.room.phase;
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <Header view={view} />
      {p === "collecting" && <Collecting view={view} act={act} />}
      {(p === "judging" || p === "revising") && <Working view={view} act={act} />}
      {p === "voting" && <Voting view={view} act={act} />}
      {p === "feedback" && <Feedback view={view} act={act} />}
      {p === "tie" && <Tie view={view} act={act} />}
      {p === "decided" && <Decided view={view} />}
    </main>
  );
}

function Join({ code, onJoined }: { code: string; onJoined: (s: Session) => void }) {
  const info = useQuery(api.rooms.joinInfo, { code });
  const join = useMutation(api.rooms.join);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="card space-y-4">
        <p className="text-sm font-semibold text-accent">Temora</p>
        {info === undefined && <p className="text-sm text-muted">読み込み中…</p>}
        {info === null && <p className="text-sm text-x">会議が見つかりません。コードを確認してください。</p>}
        {info && (
          <>
            <div>
              <h1 className="text-xl font-bold">{info.title}</h1>
              {info.theme && <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{info.theme}</p>}
            </div>
            {info.open ? (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  try {
                    onJoined(await join({ code, name }));
                  } catch (err) {
                    setError(errorText(err));
                    setBusy(false);
                  }
                }}
              >
                <label className="label" htmlFor="f1">
                  あなたの名前
                </label>
                <input id="f1" className="input" required maxLength={30} value={name} onChange={(e) => setName(e.target.value)} />
                <button className="btn w-full" disabled={busy}>
                  参加する
                </button>
              </form>
            ) : (
              <p className="text-sm text-muted">案の受付が終わったため、新しく参加できません。</p>
            )}
          </>
        )}
        {error && <p className="text-sm text-x">{error}</p>}
      </div>
    </main>
  );
}
