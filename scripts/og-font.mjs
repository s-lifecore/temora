// 共有画像（OG 画像）用に、使う文字だけを含む日本語フォント（Zen Maru Gothic・SIL OFL）を取得する。
// 画像の文言を変えたら `npm run og:font` で作り直す。
import { readFile, writeFile } from "node:fs/promises";

const source = await readFile(new URL("../src/app/og-text.ts", import.meta.url), "utf8");
const text = [
  ...new Set(
    source
      .match(/"([^"]*)"/g)
      .join("")
      .replace(/"/g, ""),
  ),
].join("");

for (const weight of [700, 900]) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const url = css.match(/src: url\(([^)]+)\) format\('(truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error(`フォントの URL が見つかりません（${weight}）:\n${css.slice(0, 300)}`);
  const font = Buffer.from(await (await fetch(url)).arrayBuffer());
  await writeFile(new URL(`../assets/og-font-${weight}.ttf`, import.meta.url), font);
  console.log(`assets/og-font-${weight}.ttf: ${(font.length / 1024).toFixed(1)} KB`);
}
