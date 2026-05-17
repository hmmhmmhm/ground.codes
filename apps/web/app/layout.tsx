import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { Locale } from "@/i18n";
import { DisableZoom } from "@/components/disable-zoom";
import "@repo/ui/globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ground Codes",
  description:
    "Share precise Earth, Moon, and Mars locations with short memorable Ground Codes.",
  metadataBase: new URL("https://ground.codes"),
  openGraph: {
    title: "Ground Codes",
    description:
      "Search, copy, and share precise locations as short memorable codes.",
    url: "https://ground.codes",
    siteName: "Ground Codes",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Ground Codes",
    description:
      "Search, copy, and share precise locations as short memorable codes.",
  },
  alternates: {
    canonical: "https://ground.codes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "dark",
  themeColor: "#212121",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${spaceMono.className} antialiased`}>
        <DisableZoom />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <I18nProvider initialLocale={locale as Locale}>
            {children}
          </I18nProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
