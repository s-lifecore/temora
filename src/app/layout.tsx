import type { Metadata, Viewport } from "next";
import { Zen_Maru_Gothic, Zen_Old_Mincho } from "next/font/google";
import { ConvexClientProvider } from "./convex-provider";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, siteUrl } from "@/lib/site";

const maru = Zen_Maru_Gothic({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-maru", display: "swap" });
const mincho = Zen_Old_Mincho({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mincho",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_TITLE, template: `%s｜${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["テーマ決め", "アイデア", "合意形成", "ハッカソン", "勉強会", "サークル", "投票", "AI"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ja_JP",
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#161614" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  alternateName: "テモラ",
  url: siteUrl(),
  description: SITE_DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "ja",
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${maru.variable} ${mincho.variable} h-full antialiased`}>
      <body className="min-h-full">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
