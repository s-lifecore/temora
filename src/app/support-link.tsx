import Link from "next/link";
import { supportUrl } from "@/lib/support";

// 応援の受け先（NEXT_PUBLIC_SUPPORT_URL）が設定されているときだけ、応援ページへの入口を出す

export function SupportCard() {
  if (!supportUrl()) return null;
  return (
    <section className="card flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Temora は無料で使えます。気に入ったら、開発と運営を応援してもらえるとうれしいです。
      </p>
      <Link href="/support" className="btn-ghost shrink-0">
        応援する
      </Link>
    </section>
  );
}

export function SupportInline() {
  if (!supportUrl()) return null;
  return (
    <p className="text-center text-sm text-muted">
      Temora が役に立ったら、
      <Link href="/support" className="text-accent underline">
        応援してもらえるとうれしいです
      </Link>
    </p>
  );
}
