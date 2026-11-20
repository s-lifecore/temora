import type { Metadata } from "next";
import Link from "next/link";
import { supportUrl } from "@/lib/support";
import { ThemeDecor, ThemeDecorPeek } from "../theme-decor";

export const metadata: Metadata = {
  title: "応援する",
  description:
    "Temora を無料で使い続けてもらうための応援について。なぜ応援が必要か、応援を何に使うかを説明しています。",
  alternates: { canonical: "/support" },
  openGraph: { url: "/support", title: "Temora を応援する" },
};

const USES = [
  {
    title: "AI の利用料",
    body: "案を判断軸に照らすたびに、AI の利用料がかかります。会議が増えるほど、この費用も増えます。",
  },
  {
    title: "サーバーなどの運営費",
    body: "サイトを動かし続けるための、サーバーやドメインなどの費用です。",
  },
  {
    title: "これからの開発",
    body: "使ってくれた人の声をもとに、迷いにくい画面や、チームで使いやすい機能を作っていきます。",
  },
];

export default function SupportPage() {
  const url = supportUrl();
  return (
    <div data-design="simple" className="min-h-screen">
      <ThemeDecor design="simple" />
      <main className="mx-auto max-w-xl space-y-6 px-4 py-10">
        <ThemeDecorPeek design="simple" className="-mb-6" />
        <header>
          <Link href="/" className="text-sm font-semibold text-accent">
            Temora
          </Link>
          <h1 className="mt-1 text-2xl leading-snug font-bold">Temora を応援する</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Temora
            は、アイデアを持ち寄ってみんなでテーマを決める場を、誰でも無料で使えるように個人で開発・運営しています。
          </p>
        </header>

        <section className="card space-y-2">
          <h2 className="font-bold">なぜ応援が必要か</h2>
          <p className="text-sm leading-relaxed">
            無料で使ってもらうためにかかる費用は、いまは開発者がすべて負担しています。使ってくれる人が増えるほど、費用も増えていきます。応援してもらえると、無料のまま続けやすくなります。
          </p>
        </section>

        <section className="card space-y-3">
          <h2 className="font-bold">応援を何に使うか</h2>
          <ul className="space-y-3">
            {USES.map((u) => (
              <li key={u.title}>
                <p className="text-sm font-semibold">{u.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{u.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card space-y-3">
          <h2 className="font-bold">応援のしかた</h2>
          {url ? (
            <>
              <a href={url} target="_blank" rel="noopener noreferrer" className="btn w-full">
                応援ページを開く（外部サイト）
              </a>
              <p className="hint leading-relaxed">
                外部の応援サービスに移動します。お支払いはそのサービスの上で行われ、Temora
                がカード情報などを受け取ることはありません。
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">応援の受付は準備中です。</p>
          )}
        </section>

        <p className="text-center text-sm leading-relaxed text-muted">
          応援してもしなくても、使える機能は変わりません。使ってもらえることが、いちばんの応援です。
        </p>

        <p className="text-center">
          <Link href="/" className="text-sm text-muted underline">
            トップに戻る
          </Link>
        </p>
      </main>
    </div>
  );
}
