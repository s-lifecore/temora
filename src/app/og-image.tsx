import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OG_TEXT } from "./og-text";
import { FunNotes, FunThinker } from "./theme-decor";

export const OG_SIZE = { width: 1200, height: 630 };

const bold = readFile(join(process.cwd(), "assets/og-font-700.ttf"));
const black = readFile(join(process.cwd(), "assets/og-font-900.ttf"));

const INK = "#2b2118";

export async function renderOgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#fff6e0",
        backgroundImage: "radial-gradient(#f3d9a4 2px, transparent 2px)",
        backgroundSize: "28px 28px",
        padding: 48,
        fontFamily: "Zen Maru Gothic",
        color: INK,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          background: "#ffffff",
          border: `5px solid ${INK}`,
          borderRadius: 40,
          boxShadow: `12px 12px 0 ${INK}`,
          padding: "52px 0 0 56px",
          overflow: "hidden",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 660, paddingBottom: 52 }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <span style={{ fontSize: 96, fontWeight: 900, color: "#ff5d3a" }}>{OG_TEXT.name}</span>
            <span style={{ fontSize: 40, fontWeight: 700, color: "#7a6a58" }}>{OG_TEXT.kana}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
            {OG_TEXT.lines.map((line) => (
              <span key={line} style={{ fontSize: 54, fontWeight: 900, lineHeight: 1.35 }}>
                {line}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 30 }}>
            <svg
              width="132"
              height="40"
              viewBox="0 0 132 40"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="20" cy="20" r="14" stroke="#14965a" />
              <path d="M66 6 L82 34 H50 Z" stroke="#e39b00" />
              <path d="M100 8 L124 32 M124 8 L100 32" stroke="#e5383b" />
            </svg>
            <span style={{ fontSize: 28, fontWeight: 700, color: "#7a6a58" }}>{OG_TEXT.sub}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignSelf: "flex-end", marginLeft: "auto", paddingRight: 36, gap: 6 }}>
          <div style={{ display: "flex", width: 165, height: 240 }}>
            <FunThinker width={165} height={240} />
          </div>
          <div style={{ display: "flex", width: 165, height: 240 }}>
            <FunNotes width={165} height={240} />
          </div>
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Zen Maru Gothic", data: await bold, weight: 700, style: "normal" },
        { name: "Zen Maru Gothic", data: await black, weight: 900, style: "normal" },
      ],
    },
  );
}
