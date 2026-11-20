export type PricingChoice = { id: string; label: string; detail: string; price: number };
export type PricingOption = { id: string; label: string; choices: PricingChoice[] };
export type Selection = Record<string, string>;

// 個人プラン：会議ごとに項目を選んで上乗せする。人数は無料の12人で固定（ハッカソンのチームは基本5人まで）
export const PERSONAL_MEMBER_LIMIT = 12;

export const PRICING_OPTIONS: PricingOption[] = [
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
    id: "ideas",
    label: "1人あたりの案",
    choices: [
      { id: "5", label: "5つまで", detail: "", price: 0 },
      { id: "10", label: "10個まで", detail: "アイデアをたくさん出したいときに", price: 100 },
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
      { id: "custom", label: "ロゴ・色を入れる", detail: "自分たちのロゴと色で表示する", price: 200 },
    ],
  },
];

export const DEFAULT_SELECTION: Selection = Object.fromEntries(PRICING_OPTIONS.map((o) => [o.id, o.choices[0].id]));

export const PRESETS: { id: string; label: string; detail: string; selection: Selection }[] = [
  { id: "small", label: "ゼミ・少人数", detail: "標準のまま", selection: DEFAULT_SELECTION },
  {
    id: "hackathon",
    label: "ハッカソンのチーム",
    detail: "高精度・締切前のリマインド",
    selection: { ...DEFAULT_SELECTION, accuracy: "high", notify: "remind" },
  },
  {
    id: "important",
    label: "大事な決定",
    detail: "最高精度・1年保存＋書き出し",
    selection: { ...DEFAULT_SELECTION, accuracy: "best", record: "1y" },
  },
];

export function choiceOf(option: PricingOption, selection: Selection): PricingChoice {
  return option.choices.find((c) => c.id === selection[option.id]) ?? option.choices[0];
}

export function totalPrice(selection: Selection): number {
  return PRICING_OPTIONS.reduce((sum, o) => sum + choiceOf(o, selection).price, 0);
}

// 法人・団体プラン：運営向け。決まった枠はその場で購入、枠を超えるものは相談
export type OrgPlan = {
  id: string;
  label: string;
  price: number | null;
  unit: string;
  summary: string;
  features: string[];
  purchase: "checkout" | "contact";
};

export const ORG_FEATURES = [
  "チームごとの会議をまとめて作成",
  "各チームの代表にホストの権限を渡す",
  "運営の管理画面（全チームの提出・承認・決定を一覧）",
  "1会議の人数を拡大",
  "ロゴ・色を入れる",
  "決定の記録の書き出し（PDF・CSV）",
];

export const ORG_PLANS: OrgPlan[] = [
  {
    id: "event",
    label: "イベント",
    price: 5000,
    unit: "1イベント",
    summary: "20チームまで。ハッカソンや勉強会1回分",
    features: ORG_FEATURES,
    purchase: "checkout",
  },
  {
    id: "annual",
    label: "年額",
    price: 30000,
    unit: "1年",
    summary: "イベント数は無制限。サークル・GDGoC・ゼミなど定期的に使う団体に",
    features: ORG_FEATURES,
    purchase: "checkout",
  },
  {
    id: "custom",
    label: "大規模・特別対応",
    price: null,
    unit: "",
    summary: "20チームを超える、請求書払い、独自の要望など",
    features: [...ORG_FEATURES, "請求書払い（見積書・請求書の発行）", "規模や要望に合わせた調整"],
    purchase: "contact",
  },
];
