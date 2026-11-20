import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#2f5d50" }}>
      <svg viewBox="0 0 64 64" width="180" height="180">
        <circle cx="32" cy="32" r="22" fill="none" stroke="#e4eee9" strokeWidth="3" opacity="0.45" />
        <path d="M19 20h26M32 20v26" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      </svg>
    </div>,
    size,
  );
}
