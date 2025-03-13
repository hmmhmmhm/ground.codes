import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";
import "@repo/ui/globals.css";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ground Codes",
  description: "Ground code come to exact earth (+mars) address",
};

export const viewport: Viewport = {
  themeColor: "#212121",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceMono.className} antialiased`}>{children}</body>
    </html>
  );
}
