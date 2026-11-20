export type PricingChoice = { id: string; label: string; detail: string; price: number };
export type PricingOption = { id: string; label: string; choices: PricingChoice[] };
export type Selection = Record<string, string>;

export const PRICING_OPTIONS: PricingOption[] = [
  {
    id: "members",
    label: "参加人数",
    choices: [
      { id: "12", label: "12人まで", detail: "少人数のチームやゼミに", price: 0 },
      { id: "30", label: "30人まで", detail: "ハッカソンやサークル全体で", price: 200 },
      { id: "100", label: "100人まで", detail: "大きなイベントや授業で", price: 600 },
    ],
  },
  {
    id: "ideas",
    label: "1人あたりの案",
    choices: [
      { id: "5", label: "5つまで", detail: "", price: 0 },
      { id: "10", label: "10個まで", detail: "アイデアをたくさん出したいときに", price: 100 },
    ],
  },
  {
    id: "accuracy",
    label: "判定の精度",
    choices: [
      { id: "standard", label: "標準", detail: "ふだんの案決めに十分な精度", price: 0 },
      { id: "high", label: "高精度", detail: "条件が多い・案が長いときに", price: 100 },
      { id: "best", label: "最高精度", detail: "大事な決定を慎重に照らしたいときに", price: 300 },
    ],
  },
  {
    id: "record",
    label: "決定の記録",
    choices: [
      { id: "30d", label: "30日保存", detail: "", price: 0 },
      { id: "1y", label: "1年保存＋書き出し", detail: "決定の理由を PDF・CSV で残せる", price: 200 },
    ],
  },
  {
    id: "notify",
    label: "通知",
    choices: [
      { id: "none", label: "なし", detail: "", price: 0 },
      { id: "remind", label: "締切前のリマインド", detail: "メールや Discord で知らせる", price: 100 },
    ],
  },
  {
    id: "brand",
    label: "見た目",
    choices: [
      { id: "designs", label: "4種のデザイン", detail: "", price: 0 },
      { id: "custom", label: "ロゴ・色を入れる", detail: "団体のロゴと色で表示する", price: 200 },
    ],
  },
];

export const DEFAULT_SELECTION: Selection = Object.fromEntries(PRICING_OPTIONS.map((o) => [o.id, o.choices[0].id]));

export const PRESETS: { id: string; label: string; detail: string; selection: Selection }[] = [
  { id: "small", label: "ゼミ・少人数", detail: "標準のまま", selection: DEFAULT_SELECTION },
  {
    id: "hackathon",
    label: "ハッカソン",
    detail: "30人・高精度・リマインド",
    selection: { ...DEFAULT_SELECTION, members: "30", accuracy: "high", notify: "remind" },
  },
  {
    id: "event",
    label: "新歓・大きなイベント",
    detail: "100人・記録・ロゴ",
    selection: { ...DEFAULT_SELECTION, members: "100", record: "1y", brand: "custom" },
  },
];

export function choiceOf(option: PricingOption, selection: Selection): PricingChoice {
  return option.choices.find((c) => c.id === selection[option.id]) ?? option.choices[0];
}

export function totalPrice(selection: Selection): number {
  return PRICING_OPTIONS.reduce((sum, o) => sum + choiceOf(o, selection).price, 0);
}
