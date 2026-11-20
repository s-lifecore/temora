import type { Metadata } from "next";
import Link from "next/link";
import { ThemeDecor, ThemeDecorPeek } from "./theme-decor";

export const metadata: Metadata = {
  title: "ページが見つかりません | Temora",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div data-design="simple" className="min-h-screen">
      <ThemeDecor design="simple" />
      <main className="mx-auto max-w-md px-4 py-16">
        <ThemeDecorPeek design="simple" />
        <section className="card space-y-3 text-center">
          <p className="text-sm font-semibold text-accent">Temora</p>
          <h1 className="text-xl font-bold">ページが見つかりません</h1>
          <p className="text-sm leading-relaxed text-muted">
            URL
            が間違っているか、ページが移動・削除された可能性があります。会議に参加する場合は、招待リンクか会議コードを確認してください。
          </p>
          <Link href="/" className="btn inline-flex">
            トップに戻る
          </Link>
        </section>
      </main>
    </div>
  );
}
