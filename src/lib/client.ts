import { ConvexError } from "convex/values";

export type Session = { memberId: string; token: string };

const key = (code: string) => `temora:${code.toUpperCase()}`;

const EVENT = "temora-session";

export function readSessionRaw(code: string): string | null {
  try {
    return localStorage.getItem(key(code));
  } catch {
    return null;
  }
}

export function parseSession(raw: string | null): Session | null {
  try {
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function loadSession(code: string): Session | null {
  return parseSession(readSessionRaw(code));
}

export function saveSession(code: string, s: Session) {
  try {
    localStorage.setItem(key(code), JSON.stringify(s));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeSession(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function errorText(e: unknown): string {
  if (e instanceof ConvexError) return String(e.data);
  return "エラーが起きました。少し待ってからもう一度試してください";
}
