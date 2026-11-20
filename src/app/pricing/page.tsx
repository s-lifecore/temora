import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Configurator } from "./configurator";

export const metadata: Metadata = {
  title: "料金の試作 | Temora",
  robots: { index: false, follow: false },
};

export default function PricingPrototypePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Configurator />;
}
