export const SITE_NAME = "Temora";
export const SITE_TITLE = "Temora（テモラ）｜アイデアを持ち寄って、みんなでテーマを決める";
export const SITE_DESCRIPTION =
  "各自が案と譲れない条件を出すと、AI が全案を同じ基準で ○△✕ に照らします。候補を最大3つに絞り、どれにするかは全員の承認で決めます。集まれなくても、締切が来たら自動で進みます。ハッカソンや勉強会、サークルのテーマ決めに。";

const fallback = "https://temora.lifecore.jp";

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return fallback;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.hostname === "localhost" ? url.origin : fallback;
  } catch {
    return fallback;
  }
}
