import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Space_Grotesk, Space_Mono, Manrope, JetBrains_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/plans";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

// Cyrillic companions: Space Grotesk and Space Mono ship Latin only, so these
// carry the Russian glyphs while keeping the same geometric/mono character.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
  },
  title: "Число имени — Нумерология по имени онлайн бесплатно",
  description:
    "Узнай своё число имени бесплатно. Введи имя — получи нумерологический анализ мгновенно. Характер, деньги и предназначение по имени.",
  keywords: [
    "число имени",
    "нумерология по имени",
    "число имени онлайн",
    "нумерология имя бесплатно",
    "значение имени нумерология",
    "число имени онлайн бесплатно",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "Число имени",
    title: "Число имени — Нумерология по имени онлайн бесплатно",
    description:
      "Узнай своё число имени бесплатно. Введи имя — получи нумерологический анализ мгновенно. Характер, деньги и предназначение по имени.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Число имени — Нумерология по имени онлайн бесплатно",
    description:
      "Узнай своё число имени бесплатно. Введи имя — получи нумерологический анализ мгновенно.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#050508",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} ${manrope.variable} ${jetbrains.variable}`}
    >
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/favicon-32x32.png" />
      </head>
      <body>
        {children}
        <footer className="site-footer">
          <nav>
            <Link href="/">Главная</Link>
            <Link href="/privacy">Политика конфиденциальности</Link>
            <Link href="/offer">Публичная оферта</Link>
          </nav>
          <p style={{ margin: 0 }}>
            Евдокимов Даниил Владимирович · ИНН 381928138362 · Самозанятый
          </p>
          <p style={{ margin: "4px 0 0" }}><a href="mailto:danyavdkmvv3@gmail.com">danyavdkmvv3@gmail.com</a> · Telegram <a href="https://t.me/dvdkmv" target="_blank" rel="noopener noreferrer">@dvdkmv</a></p>
          <p style={{ margin: "10px 0 0", opacity: 0.6 }}>
            Материалы носят развлекательный характер. 18+
          </p>
        </footer>
      </body>
    </html>
  );
}
