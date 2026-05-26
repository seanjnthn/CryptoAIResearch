import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crypto AI Research Dashboard",
  description:
    "A structured crypto research assistant using market context, DeFi fundamentals, and on-demand AI summaries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
