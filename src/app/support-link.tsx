import { supportUrl } from "@/lib/support";

export function SupportCard() {
  const url = supportUrl();
  if (!url) return null;
  return (
    <section className="card flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Temora は無料で使えます。気に入ったら、開発と運営を応援してもらえるとうれしいです。
      </p>
      <SupportButton url={url} />
    </section>
  );
}

export function SupportInline() {
  const url = supportUrl();
  if (!url) return null;
  return (
    <p className="text-center text-sm text-muted">
      Temora が役に立ったら、
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent underline">
        応援してもらえるとうれしいです
      </a>
    </p>
  );
}

function SupportButton({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="btn-ghost shrink-0">
      応援する
    </a>
  );
}
