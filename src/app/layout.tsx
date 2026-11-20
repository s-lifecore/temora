import type { Metadata } from "next";
import { ConvexClientProvider } from "./convex-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Temora",
  description: "アイデアを持ち寄って、みんなでテーマを決める",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
