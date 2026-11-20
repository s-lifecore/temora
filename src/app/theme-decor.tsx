import type { Design } from "@/lib/designs";

// テーマごとの飾りの絵。広い画面（パソコン）では左右の余白に、狭い画面（スマホなど）では最初のカードの上に小さく並べる

export function ThemeDecor({ design }: { design: Design }) {
  const pair = DECOR[design];
  if (!pair) return null;
  return (
    <>
      <div className="theme-decor theme-decor-left" aria-hidden>
        {pair.left}
      </div>
      <div className="theme-decor theme-decor-right" aria-hidden>
        {pair.right}
      </div>
    </>
  );
}

// 狭い画面（スマホなど）用：最初のカードの上に、小さく乗っているように並べる
export function ThemeDecorPeek({ design, className = "" }: { design: Design; className?: string }) {
  const pair = DECOR[design];
  if (!pair) return null;
  return (
    <div className={`theme-decor-peek ${className}`} aria-hidden>
      <div>{pair.left}</div>
      <div>{pair.right}</div>
    </div>
  );
}

const INK = "#2b2118";
const SKIN = "#ffd9b8";

function FunThinker() {
  return (
    <svg viewBox="0 0 220 320" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g className="decor-float">
        <g stroke="#e39b00" strokeWidth="5">
          <path d="M112 18v-12M150 32l9-9M74 32l-9-9M166 66h12M58 66H46" />
        </g>
        <circle cx="112" cy="64" r="28" fill="#ffd23f" stroke={INK} strokeWidth="5" />
        <path d="M100 66c4 6 8 6 12 0s8-6 12 0" stroke={INK} strokeWidth="4" />
        <rect x="100" y="92" width="24" height="14" rx="4" fill="#fff" stroke={INK} strokeWidth="5" />
      </g>
      <circle cx="132" cy="130" r="6" fill="#fff" stroke={INK} strokeWidth="4" />
      <circle cx="122" cy="148" r="4" fill="#fff" stroke={INK} strokeWidth="4" />
      <path d="M42 320c0-58 26-92 72-92s72 34 72 92" fill="#ff5d3a" stroke={INK} strokeWidth="5" />
      <circle cx="112" cy="190" r="36" fill={SKIN} stroke={INK} strokeWidth="5" />
      <path d="M78 182c2-26 18-40 36-40s34 14 34 34c-12-4-26-12-34-24-8 14-20 24-36 30z" fill={INK} />
      <circle cx="102" cy="190" r="4" fill={INK} />
      <circle cx="126" cy="190" r="4" fill={INK} />
      <circle cx="116" cy="208" r="4" fill={INK} />
      <path d="M150 300c-6-30-14-52-22-70" stroke={INK} strokeWidth="5" />
      <path d="M128 230c-8 0-14-6-12-14 3-8 14-8 18 0" fill={SKIN} stroke={INK} strokeWidth="5" />
    </svg>
  );
}

function FunNotes() {
  return (
    <svg viewBox="0 0 220 320" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g className="decor-float decor-delay">
        <g transform="rotate(-10 60 60)">
          <rect x="30" y="34" width="62" height="56" rx="4" fill="#ffe066" stroke={INK} strokeWidth="5" />
          <path d="M42 54h38M42 70h26" stroke={INK} strokeWidth="4" />
        </g>
        <g transform="rotate(8 160 80)">
          <rect x="128" y="50" width="62" height="56" rx="4" fill="#ffb3d1" stroke={INK} strokeWidth="5" />
          <path d="M140 70h38M140 86h20" stroke={INK} strokeWidth="4" />
        </g>
      </g>
      <text
        x="96"
        y="168"
        fontSize="72"
        fontWeight="900"
        fill="#3a86ff"
        stroke={INK}
        strokeWidth="4"
        paintOrder="stroke"
        fontFamily="var(--font-maru), sans-serif"
      >
        ?
      </text>
      <path d="M40 320c0-56 26-88 70-88s70 32 70 88" fill="#14965a" stroke={INK} strokeWidth="5" />
      <circle cx="110" cy="200" r="34" fill={SKIN} stroke={INK} strokeWidth="5" />
      <path d="M76 196c0-24 16-38 34-38s34 14 34 38c-10-10-22-14-34-14s-24 4-34 14z" fill="#7a4a2a" />
      <path d="M98 198c2-3 6-3 8 0M116 198c2-3 6-3 8 0" stroke={INK} strokeWidth="4" />
      <path d="M102 216c5 4 11 4 16 0" stroke={INK} strokeWidth="4" />
      <path d="M60 300c4-24 10-40 18-52" stroke={INK} strokeWidth="5" />
    </svg>
  );
}

const CALM_INK = "#34477a";
const CALM_LINE = "#2a2724";

function CalmReader() {
  return (
    <svg viewBox="0 0 220 320" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5">
      <g stroke={CALM_INK} strokeWidth="2" opacity="0.7" className="decor-steam">
        <path d="M168 196c-6-8 6-12 0-20M180 196c-6-8 6-12 0-20" />
      </g>
      <path d="M160 206h28v26a14 14 0 0 1-28 0z" fill="#fbf9f4" stroke={CALM_LINE} />
      <path d="M188 212c10 0 10 14 0 14" stroke={CALM_LINE} />
      <path d="M30 320c4-60 26-96 64-96s58 36 62 96" fill="#e5e8f0" stroke={CALM_LINE} />
      <circle cx="94" cy="176" r="30" fill="#fbf9f4" stroke={CALM_LINE} />
      <path d="M64 170c4-22 18-34 34-32 14 2 26 14 26 30-16 0-30-8-38-18-6 10-12 16-22 20z" fill={CALM_LINE} />
      <path d="M82 184c3 2 7 2 10 0M102 184c3 2 7 2 10 0" stroke={CALM_LINE} />
      <path d="M58 262l40 12 40-12v-34l-40 12-40-12z" fill="#fbf9f4" stroke={CALM_INK} />
      <path d="M98 240v34" stroke={CALM_INK} />
      <path d="M68 246l22 6M68 256l22 6M106 252l22-6M106 262l22-6" stroke={CALM_INK} strokeWidth="1.5" />
    </svg>
  );
}

function CalmPlant() {
  return (
    <svg viewBox="0 0 220 320" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5">
      <path d="M110 230V120" stroke={CALM_LINE} />
      <path d="M110 200c-30-4-46-24-48-50 26 2 44 20 48 50z" fill="#c9d8cc" stroke={CALM_LINE} />
      <path d="M110 176c28-6 42-28 42-54-24 4-40 24-42 54z" fill="#c9d8cc" stroke={CALM_LINE} />
      <path d="M110 140c-18-8-26-24-24-44 18 6 26 22 24 44z" fill="#c9d8cc" stroke={CALM_LINE} />
      <path d="M82 230h56l-8 60h-40z" fill="#e5e8f0" stroke={CALM_LINE} />
      <rect x="30" y="296" width="160" height="12" fill="#fbf9f4" stroke={CALM_INK} />
      <rect x="38" y="284" width="130" height="12" fill="#e5e8f0" stroke={CALM_INK} />
      <rect x="46" y="272" width="30" height="12" fill="#fbf9f4" stroke={CALM_INK} />
    </svg>
  );
}

const COOL = "#2dd4bf";

function CoolStargazer() {
  return (
    <svg viewBox="0 0 220 320" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g fill={COOL} className="decor-twinkle">
        <circle cx="40" cy="40" r="2.5" />
        <circle cx="96" cy="22" r="2" />
        <circle cx="150" cy="60" r="3" />
        <circle cx="186" cy="28" r="2" />
        <circle cx="70" cy="96" r="2" />
        <circle cx="176" cy="118" r="2.5" />
      </g>
      <path
        d="M0 320c30-70 90-96 140-96s70 30 80 96z"
        fill="#121a26"
        stroke={COOL}
        strokeOpacity="0.5"
        strokeWidth="2"
      />
      <g fill="#0b1018" stroke={COOL} strokeWidth="2.5" className="decor-glow">
        <circle cx="104" cy="168" r="18" />
        <path d="M84 230c0-24 8-40 20-40s22 16 22 40z" />
        <path d="M86 228l-26 6M124 222l20 14" />
      </g>
    </svg>
  );
}

function CoolConstellation() {
  const pts: [number, number][] = [
    [110, 60],
    [140, 76],
    [150, 108],
    [134, 138],
    [122, 168],
    [98, 168],
    [86, 138],
    [70, 108],
    [80, 76],
  ];
  return (
    <svg viewBox="0 0 220 320" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M176 40a22 22 0 1 0 18 34 18 18 0 1 1-18-34z" fill={COOL} opacity="0.85" className="decor-glow" />
      <path
        d={`M${pts.map((p) => p.join(" ")).join(" L")} Z M98 186h24M100 200h20`}
        stroke={COOL}
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <g fill={COOL} className="decor-twinkle">
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3.5 : 2.5} />
        ))}
        <circle cx="40" cy="220" r="2" />
        <circle cx="180" cy="250" r="2.5" />
        <circle cx="60" cy="290" r="2" />
      </g>
    </svg>
  );
}

const DECOR: Partial<Record<Design, { left: React.ReactNode; right: React.ReactNode }>> = {
  fun: { left: <FunThinker />, right: <FunNotes /> },
  calm: { left: <CalmReader />, right: <CalmPlant /> },
  cool: { left: <CoolStargazer />, right: <CoolConstellation /> },
};
