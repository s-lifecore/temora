import type { Metadata } from "next";
import { Zen_Maru_Gothic, Zen_Old_Mincho } from "next/font/google";
import { ConvexClientProvider } from "./convex-provider";
import "./globals.css";

const maru = Zen_Maru_Gothic({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-maru", display: "swap" });
const mincho = Zen_Old_Mincho({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-mincho", display: "swap" });

export const metadata: Metadata = {
  title: "Temora",
  description: "アイデアを持ち寄って、みんなでテーマを決める",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${maru.variable} ${mincho.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
