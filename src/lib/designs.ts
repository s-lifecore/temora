export const DESIGNS = [
  { id: "simple", label: "シンプル", desc: "すっきり見やすい。迷ったらこれ" },
  { id: "fun", label: "楽しい", desc: "丸い文字と明るい色。決まったら紙吹雪" },
  { id: "calm", label: "落ち着いた", desc: "明朝体と生成り色。ゼミや勉強会に" },
  { id: "cool", label: "クール", desc: "暗い背景にシアン。夜のハッカソンに" },
] as const;

export type Design = (typeof DESIGNS)[number]["id"];

export const DEFAULT_DESIGN: Design = "simple";

export const STEP_ICONS: Partial<Record<Design, string[]>> = {
  fun: ["💡", "🔍", "✋", "🎉"],
};
