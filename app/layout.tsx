import type { Metadata } from "next";
import { DM_Serif_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "A live IT helpdesk agent for a USA-based SAP environment, built to make tool calling, persistent memory, and the Model Context Protocol visible while they happen, not just described.";

export const metadata: Metadata = {
  metadataBase: new URL("https://it-helpdesk-copilot.vercel.app"),
  title: "IT Helpdesk Copilot | Elegance AI",
  description: DESCRIPTION,
  openGraph: {
    title: "IT Helpdesk Copilot",
    description: DESCRIPTION,
    siteName: "Elegance AI",
    type: "article",
    url: "/lab/it-helpdesk-copilot",
  },
  twitter: {
    card: "summary_large_image",
    title: "IT Helpdesk Copilot",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSerif.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
