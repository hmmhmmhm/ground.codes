import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "@repo/ui/globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ground Codes",
  description: "Ground code come to exact earth (+mars) address",
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
